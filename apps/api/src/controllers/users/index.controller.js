const {
  User,
  Booking,
  Wallet,
  Session,
  Payment,
  Location,
  UserReferral,
  Setting,
} = require("../../models");
const userService = require("../../services/user.service");
const Utils = require("../../utils/utils");
const bcrypt = require("bcryptjs");
const UniqueString = require("unique-string");
const Helper = require("../../models/Helper.model");
const MetaData = require("../../models/MetaData.model");
const nodeMailer = require("nodemailer");
const objectIdToTimestamp = require("objectid-to-timestamp");
const momenttz = require("moment-timezone");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const requestIp = require("request-ip");
const qr = require("qr-image");
const { user } = require("../../notifications");
const { enqueueSendSMS } = require("../../queues/sms.queue");
const { enqueueDeleteUser } = require("../../queues/user.queue");
const { nanoid } = require("nanoid");
const _ = require("lodash");

module.exports = {
  registerLogin: async (req, res) => {
    try {
      const { country_code, phone, device_id, device_type, country_details } =
        req.body;

      console.log("req.body", req.body);

      const parsedDeviceType = (() => {
        if (device_type === undefined || device_type === null || device_type === "") return 1;
        if (typeof device_type === "string") {
          const normalized = device_type.trim().toLowerCase();
          if (normalized === "android") return 1;
          if (normalized === "ios") return 2;
        }
        return Number(device_type);
      })();

      if (![1, 2].includes(parsedDeviceType)) {
        return res.status(400).json({
          status: false,
          title: "Invalid device_type",
          message: "device_type must be 1 (Android) or 2 (iOS).",
        });
      }

      if (!phone || !country_code) {
        return res.status(400).json({
          status: false,
          title: "Missing fields",
          message: "phone and country_code are required.",
        });
      }

      const ip = requestIp.getClientIp(req);
      const otp = Utils.generatingOTP(100000, 999999);

      // find user by phone only; if exists treat as login else register
      // find active user by phone
      let user = await User.findOne({
        phone,
        country_code,
        is_deleted: false,
        status: true,
      });
      let flag = 0;
      let title = "User Registration Successful";

      console.log("user", user);
      if (user) {
        flag = 1;
        title = "User login Successful";
        await User.updateOne(
          { _id: user._id },
          {
            device_id,
            device_type: parsedDeviceType,
            ip,
            otp,
          },
        );
      } else {
        const refercode = Utils.referCode(6, phone);
        user = await new User({
          country_code,
          phone,
          refercode,
          device_id,
          device_type: parsedDeviceType,
          ip,
          otp,
        }).save();

        await new Wallet({
          users: user._id,
          refercode,
          amount: 0,
        }).save();
      }

      const wallet = await Wallet.findOne({ users: user._id });
      const session = await Utils.initSession(
        phone,
        user._id,
        wallet._id,
        "User",
      );

      await Utils.sendSMS(
        `${country_code}${phone}`,
        otp,
        undefined,
        `Your OTP for ${global.DEFAULT_APPNAME || "Shuttle Bus"} is ${otp}. Please do not share this with anyone.`,
      );

      if (!_.isEmpty(country_details)) {
        await MetaData.create("country", JSON.parse(country_details));
      }

      return res.status(200).json({
        title,
        status: true,
        flag, // 0 => registration, 1 => login
        otp: otp, // Included for development/testing
        csrfToken: session.csrfToken,
        token: session.token,
        is_demo: process.env.DEMO_MODE === "true",
      });
    } catch (err) {
      console.log("err", err);
      res.status(404).json({
        status: false,
        title: "Registration Error",
        message: "Something went wrong during registration/login.",
        errorMessage: err.message,
      });
    }
  },
  verifyOTP: async function (req, res) {
    try {
      const { otp, device_token, device_type, device_info } = req.body;
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: false,
          message: "Session expired or user not authenticated.",
        });
      }
      const { userId } = req.session;

      const getUser = await userService.getUserById(userId);
      if (getUser) {
        const isVerified = await userService.verifyOTPExists(userId, otp);

        if (isVerified) {
          const persistedUser = await userService.updateUserById(userId, {
            otp: 0, // Reset OTP after verification
            is_mobile_verified: true,
            device_token,
            device_type,
            device_info,
          });
          res.json({
            status: true,
            userDetail: User.formatedData(persistedUser),
            is_demo: process.env.DEMO_MODE === "true",
            message: "OTP verify successful",
          });
        } else {
          res.json({
            status: false,
            message: "OTP not matched.",
          });
        }
      } else {
        res.json({
          status: false,
          message: "User not found.",
        });
      }
    } catch (err) {
      res.status(200).json({
        message: "Invalid OTP",
        status: false,
        errorMessage: err.message,
      });
    }
  },
  reSendOTP: async (req, res) => {
    try {
      const { phone } = req.body;
      const { userId } = req.session;
      const otp = await Utils.generatingOTP(100000, 999999);
      // Check for active user only
      console.log("req.body", req.body);
      const userExist = await User.exists({
        phone: phone,
        is_deleted: false,
        status: true,
      });
      console.log("userExist", userExist);
      if (userExist) {
        const updateuser = await User.findOneAndUpdate(
          {
            phone: phone,
            is_deleted: false,
          },
          {
            otp: otp,
          },
        );
        const payload = {
          phone: `${updateuser.country_code ?? "91"}${phone}`,
          otp: otp,
          message: `Your OTP for ${global.DEFAULT_APPNAME || "Shuttle Bus"} is ${otp}. Please do not share this with anyone.`,
        };
        console.log("payload", payload);

        await enqueueSendSMS(payload);
        res.status(200).json({
          message: "resend otp Successful",
          status: true,
          otp: otp,
        });
      } else {
        res.status(200).json({
          message: "phone number not exists.",
          status: true,
        });
      }
    } catch (err) {
      res.status(401).json({
        message: "Invalid OTP",
        status: false,
        errorMessage: err.message,
      });
    }
  },
  refresh: async (req, res) => {
    try {
      const { phone, csrfToken, onModel } = req.body;
      const session = await Utils.refreshToken(phone, csrfToken, onModel);
      res.status(200).json({
        status: true,
        message: "token updated successfully.",
        data: {
          token: session.token,
          csrfToken: session.csrfToken,
        },
      });
    } catch (err) {
      res.status(400).json({
        status: false,
        title: "Error while",
        message: "Something went wrong during refresh token.",
        errorMessage: err,
      });
    }
  },
  updateLang: async (req, res) => {
    try {
      const { language } = req.body;
      const { userId } = req.session;
      const updateUser = await User.findByIdAndUpdate(
        userId,
        { language },
        { returnDocument: "after", upsert: true },
      );
      res.status(200).json({
        status: true,
        statusCode: 22,
        message: "Language updated successfully.",
      });
    } catch (err) {
      res.status(200).json({
        message: "Language updated failed",
        status: false,
        statusCode: 33,
        errorMessage: err.message,
      });
    }
  },
  help: async (req, res) => {
    try {
      const { contact, helpemail, description } = req.body;
      const { userId } = req.session;
      const user = await User.findById(
        {
          _id: userId,
        },
        {
          firstname: 1,
          lastname: 1,
          gender: 1,
          email: 1,
          phone: 1,
          _id: 0,
        },
      );
      contactNum = Number(contact);
      const firstname = user.firstname;
      const lastname = user.lastname;
      const gender = user.gender;
      const email = user.email;
      const phone = user.phone;

      const helper = new Helper({
        firstname,
        lastname,
        gender,
        email,
        phone,
        helpemail,
        contactNum,
        description,
        ticket_no: momenttz().valueOf(),
      });
      const persistedHelper = await helper.save();
      const helperId = persistedHelper._id;
      if (helperId) {
        res.status(200).json({
          status: true,
          message: "Your request has been submitted.",
        });
      }
    } catch (err) {
      res.send(err);
    }
  },
  findProfile: async (req, res) => {
    try {
      const { userId, walletId } = req.session;
      const user = await User.findById(
        {
          _id: userId,
        },
        {
          email: 1,
          refercode: 1,
          referedby: 1,
          _id: 0,
        },
      ).po;

      const getuserdetail = await Wallet.findById(walletId).populate("users");
      res.json({
        status: true,
        message: "Successfully authenticated user",
        baseurl: process.env.BASE_URL,
        is_demo: process.env.DEMO_MODE === "true",
        data: User.formatedData(getuserdetail.users),
      });
    } catch (err) {
      res.status(401).json({
        status: false,
        message: "Not authorized to access this route",
        errorMessage: err.message,
      });
    }
  },
  referral: async (req, res) => {
    try {
      const { userId } = req.session;
      const refercode = await User.findById({
        _id: userId,
      }).lean();

      if (refercode.refercode == "" || refercode.refercode == undefined) {
        throw new Error("Kindly update your profile to generate refercode");
      }
      const getsetting = await Utils.getSetting();
      const refAmount = await UserReferral.totalRefAmount(userId);
      res.json({
        status: true,
        message: "Successfully found refercode",
        data: {
          amount: refAmount ? refAmount : "0",
          refercode: refercode.refercode,
          referral_policy: getsetting.referral_policy,
        },
      });
    } catch (err) {
      res.status(401).json({
        status: false,
        message: "Not authorized to access this route",
        errorMessage: err.message,
      });
    }
  },
  referrallink: async (req, res) => {
    try {
      const { phone } = req.body;
      const otp = 1234; //await Utils.generatingOTP(999, 1000); // generate OTP
      const userExist = await User.findOne({
        phone,
      });
      if (!userExist) {
        const referedby = req.params.referral;
        if (referedby != undefined && referedby != "") {
          toString(referedby);
          const ref = await User.findOne({
            refercode: {
              $eq: referedby,
            },
          });

          if (!ref) {
            throw new Error("Invalid referlink");
          }
          const refercode = Utils.referCode(6, phone);
          const user = new User({
            phone,
            otp,
            refercode,
            referedby,
          });
          const persistedUser = await user.save();
          const userId = persistedUser._id;

          const amount = 100;
          //         const credit = [{ amount: amount, status: false }];

          var date = new Date();
          date.setDate(date.getDate() + 30); // expire within the months
          await Utils.updateReferAmount(amount, date, referedby, userId); //update refer amount pending in refer user
          const wallet = new Wallet({
            users: user._id,
            refercode,
          });
          const persistedWallet = await wallet.save();
          const walletId = persistedWallet._id;
          const session = await Utils.initSession(
            phone,
            userId,
            walletId,
            "User",
          );

          res.status(200).json({
            title: "User Registration Successful",
            status: true,
            otp: otp,
            // data1: user.referedby,
            // data2: { totalamount, cref },
            flag: 0,
            userDetail: User.formatedData(persistedUser),
            csrfToken: session.csrfToken,
            token: session.token,
          });
        } else {
          throw new Error("Invalid referlink");
        }
      } else {
        res.status(200).json({
          status: false,
          message: "Phone number already exists",
        });
      }
    } catch (err) {
      res.status(400).json({
        status: false,
        title: "Registration Error",
        message: "Something went wrong during registration process.",
        errorMessage: err.message,
      });
    }
  },
  referlink: async (req, res) => {
    try {
      const { userId } = req.session;
      const refercode = await User.findById(
        {
          _id: userId,
        },
        {
          refercode: 1,
          _id: 0,
        },
      );

      if (refercode.refercode == "" || refercode.refercode == undefined) {
        throw new Error("Kindly update your profile to generate referlink");
      }
      const referlink = process.env.REFER_LINK + refercode.refercode;
      res.json({
        status: true,
        message: "Successfully found refercode",
        data: referlink,
      });
    } catch (err) {
      res.status(401).json({
        status: false,
        message: "Not authorized to access this route",
        errorMessage: err.message,
      });
    }
  },
  wallettransactions: async (req, res) => {
    try {
      const { walletId, userId } = req.session;
      const getpayments = await Payment.find({
        userId,
        walletId,
        is_pass: false,
        payment_status: { $nin: ["Processing"] },
      })
        .limit(8)
        .sort({ _id: -1 })
        .lean();
      res.json({
        status: true,
        message: "wallet history",
        data: Payment.formattedData(getpayments),
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "Not authorized to access this route",
        errorMessage: err.message,
      });
    }
  },
  bookingTransactions: async (req, res) => {
    try {
      const { userId } = req.session;
      const getPayments = await userService.bookingHistory(
        userId,
        req.query.limit,
      );
      res.json({
        status: true,
        message: "booking history",
        data: getPayments,
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "booking history not found",
        errorMessage: err.message,
      });
    }
  },
  walletcheck: async (req, res) => {
    try {
      const { walletId, userId } = req.session;
      const wallet = await Wallet.findById({
        _id: walletId,
      });
      //   var credamount = 0;
      //  credamount = await UserReferral.totalRefAmount(userId);
      // wallet.credit.forEach((item) => {
      //     if (item.amount != undefined && item.status == true) {
      //         credamount = credamount + item.amount;
      //     }
      // });
      var amount = 0;
      if (wallet.amount != undefined) {
        amount = wallet.amount;
      }

      res.json({
        status: true,
        message: "Successfully found refercode",
        data: {
          amount: amount,
        },
      });
    } catch (err) {
      res.status(401).json({
        status: false,
        message: "Not authorized to access this route",
        errorMessage: err.message,
      });
    }
  },
  addmoney: async (req, res) => {
    try {
      const { amount } = req.body;
      // our order ID
      const { userId } = req.session;
      const razorPaySetting = await Utils.configRazorPay(); // call utils for the Razory pay
      const wallet = await Wallet.findOne({
        users: {
          $eq: userId,
        },
      }).populate("users");
      const currency = razorPaySetting.payment_settings.currency;
      const receipt = razorPaySetting.ferriOrderId;
      const payment_capture = razorPaySetting.payment_settings.payment_capture;
      let parameters = {
        amount: parseInt(amount) * 100,
        currency,
        receipt,
        payment_capture,
        notes: {
          type: "wallet_recharge",
          ferriOrderId: receipt,
        },
      };

      const data = await razorPaySetting.razor.orders.create(parameters);
      const payment = new Payment({
        ferriOrderId: receipt,
        orderId: data.id,
        walletId: wallet._id,
        userId: userId,
        amount: amount,
        payment_status: "Processing",
        title: "Wallet recharge",
        type: 0,
      });
      const persistedPayment = await payment.save();
      res.status(200).json({
        status: true,
        message: "successfully added amount in wallet",
        verify_url: `${process.env.BASE_URL}api/users/payment/verify`,
        data: {
          orderId: data.id,
          amount: amount,
          name: `Wallet - ${receipt}`,
          prefill: {
            name: wallet.users.firstname + " " + wallet.users.lastname,
            email: wallet.users.email,
            contact: wallet.users.phone,
          },
          notes: {
            ferri_order_id: receipt,
          },
          payment_settings: razorPaySetting.payment_settings,
        },
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "Amount not added in wallet",
        errorMessage: err.message,
      });
    }
  },
  verifypayment: async (req, res) => {
    try {
      const { orderId, paymentId, signature, status } = req.body;

      const razorPaySetting = await Utils.configRazorPay(); // call utils for the Razory pay
      const secret = razorPaySetting.payment_settings.secret;
      let body = orderId + "|" + paymentId;
      //  const secret = process.env.RAZOR_KEY_SECRET;
      let expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body.toString())
        .digest("hex");
      if (expectedSignature == signature && status === "true") {
        const razorPaymentStatus =
          await razorPaySetting.razor.payments.fetch(paymentId);

        if (
          (razorPaymentStatus && razorPaymentStatus.status == "captured") ||
          razorPaymentStatus.status == "authorized"
        ) {
          if (await Payment.exists({ orderId, payment_status: "Processing" })) {
            const updated_payment = await Payment.findOneAndUpdate(
              {
                orderId: orderId,
              },
              {
                method: razorPaymentStatus.method
                  ? razorPaymentStatus.method
                  : "wallet",
                paymentId: paymentId,
                payment_signature: signature,
                payment_created: razorPaymentStatus.created_at,
                payment_status: "Completed",
                payment_details: {
                  notes: razorPaymentStatus.notes,
                  description: razorPaymentStatus.description,
                  wallet: razorPaymentStatus.wallet
                    ? razorPaymentStatus.wallet
                    : "",
                  invoice_id: razorPaymentStatus.invoice_id
                    ? razorPaymentStatus.invoice_id
                    : "",
                  bank: razorPaymentStatus.bank ? razorPaymentStatus.bank : "",
                  card_id: razorPaymentStatus.card_id
                    ? razorPaymentStatus.card_id
                    : "",
                  vpa: razorPaymentStatus.vpa ? razorPaymentStatus.vpa : "",
                  fee: razorPaymentStatus.fee,
                  tax: razorPaymentStatus.tax,
                  created_at: razorPaymentStatus.created_at,
                  captured: razorPaymentStatus.captured,
                },
              },
            );
            const payment = await Payment.findOne(
              {
                orderId: orderId,
              },
              "bookingId walletId amount",
            );

            var wallet = {};
            var updatedWallet = {};
            if (payment.walletId != undefined) {
              wallet = await Wallet.findOne({
                _id: payment.walletId,
              });
              var total = 0;
              total = parseInt(wallet.amount) + parseInt(payment.amount);
              updatedWallet = await Wallet.findOneAndUpdate(
                {
                  _id: payment.walletId,
                },
                {
                  amount: total,
                },
                { returnDocument: "after" },
              ).populate({
                path: "users",
                select: "firstname lastname device_token",
              });

              await Payment.findOneAndUpdate(
                { orderId: orderId, userId: wallet.users },
                { payment_status: "Completed" },
              );

              if (updatedWallet.users && updatedWallet.users.device_token) {
                user.UserNotification(
                  "Wallet Recharge Successful",
                  `Hey ${updatedWallet.users.firstname}, Amount Rs. ${payment.amount} has been added in your wallet. Your new balance is Rs. ${updatedWallet.amount}.`,
                  "",
                  updatedWallet.users.device_token,
                ); //title,message,data,token
              }
            }
            res.status(200).json({
              status: true,
              message: "payment verified successfully.",
              verification: "success",
            });
          } else if (
            await Payment.exists({ orderId, payment_status: "Completed" })
          ) {
            res.status(200).json({
              status: true,
              message: "payment verified successfully.",
              verification: "success",
            });
          }
        } else if (
          razorPaymentStatus &&
          razorPaymentStatus.status == "failed"
        ) {
          const updated_payment = await Payment.findOneAndUpdate(
            {
              orderId: orderId,
            },
            {
              method: razorPaymentStatus.method,
              payment_created: razorPaymentStatus.created_at,
              paymentId: paymentId,
              payment_signature: signature,
              payment_status: "Failed",
            },
          );
          await Payment.findOneAndUpdate(
            { orderId: orderId },
            { payment_status: "Failed" },
          );
          res.status(200).json({
            status: false,
            message: "payment failed try after sometime.",
            verification: "failed",
          });
        }
      } else {
        res.status(200).json({
          status: false,
          message: "payment cancel by customer.",
          verification: "failure",
        });
      }
    } catch (err) {
      res.status(200).json({
        status: false,
        message: "",
        errorMessage: err.message,
      });
    }
  },
  searchlocation: async (req, res) => {
    try {
      const address = req.body.address;
      var searchname = {
        title: {
          $regex: "(s+" + address + "|^" + address + ")",
          $options: "i",
        },
      };

      var location = await Location.aggregate([
        {
          $match: searchname,
        },
        {
          $group: {
            _id: "$_id",
            id: {
              $first: "$_id",
            },
            title: {
              $first: "$title",
            },
            location: {
              $first: "$location",
            },
            type: {
              $first: "$type",
            },
            city: {
              $first: "$city",
            },
            state: {
              $first: "$state",
            },
          },
        },
        {
          $limit: parseInt(req.body.limit),
        },
      ]);

      if (location.length > 0) {
        res.status(200).json({
          status: true,
          message: "Successfully found location",
          data: Location.transformData(location),
        });
      } else {
        res.status(200).json({
          status: false,
          message: "location not found",
        });
      }
    } catch (err) {
      res.status(401).json({
        status: false,
        message: "Location not found",
        errorMessage: err.message,
      });
    }
  },
  book: async (req, res) => {
    try {
      // const { userId, walletId } = req.session;
      // const user = await User.findById({ _id: userId }, { firstname: 1, lastname: 1, gender: 1, email: 1, phone: 1, refercode: 1, referedby: 1, _id: 0 });
      // const wallet = await Wallet.findById({ _id: walletId }, { money: 1, _id: 0 });
      const {
        firstname,
        lastname,
        gender,
        email,
        phone,
        bus,
        seat,
        pickup,
        destination,
        date,
        time,
      } = req.body;
      const booking = new Booking({
        firstname,
        lastname,
        gender,
        email,
        phone,
        bus,
        seat,
        pickup,
        destination,
        date,
        time,
      });
      const persistedBooking = await booking.save();
      const bookingId = persistedBooking._id;
      res.json({
        title: "Booking successful",
        detail: "Successfully booked ticket",
        booking,
      });
    } catch (err) {
      res.status(401).json({
        status: false,
        message: "Not authorized to access this route",
        errorMessage: err.message,
      });
    }
  },
  updateuser: async (req, res) => {
    try {
      if (/@vusra\.com$/.test(req.body.email)) {
        res.json({
          message: "email address not valid",
          status: false,
        });
      } else {
        const {
          firstname,
          lastname,
          email,
          gender,
          referedby,
          social_id,
          mode,
          device_token,
          home_address,
          home_lat,
          home_lng,
          home_timing,
          office_address,
          office_lat,
          office_lng,
          office_timing,
        } = req.body;

        const { userId, walletId } = req.session;
        const userExists = await User.findById(userId);
        if (userExists) {
          const updateObj = {
            firstname,
            lastname,
            email,
            gender,
            referedby,
            social_id,
            mode,
            device_token,
          };
          if (
            (home_address != "" &&
              home_lng != "" &&
              home_lat != "" &&
              home_timing != "") ||
            (office_address != "" &&
              office_lng != "" &&
              office_lat != "" &&
              office_timing != "")
          ) {
            updateObj.places = {
              home: {
                address: home_address,
                coordinates: [parseFloat(home_lng), parseFloat(home_lat)],
                timing: await Utils.joinDateTime(home_timing),
                type: "Point",
              },
              office: {
                address: office_address,
                coordinates: [parseFloat(office_lng), parseFloat(office_lat)],
                timing: await Utils.joinDateTime(office_timing),
                type: "Point",
              },
            };
          }

          if (req.file && req.file != undefined) {
            updateObj.ProfilePic = `${process.env.BASE_URL}${req.file.destination}${req.file.filename}`;
          }

          const user = await userService.updateUserById(userId, updateObj);
          res.json({
            message: "Update successful",
            status: true,
            baseurl: process.env.BASE_URL,
            data: User.formatedData(user),
          });
        } else {
          res.json({
            message: "Customer not found",
            status: true,
          });
        }
      }
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "Enter valid Information",
        errorMessage: err.message,
      });
    }
  },

  getTrips: async (req, res) => {
    try {
      const { travel_status, offset, limit } = req.body;
      const { userId, walletId } = req.session;

      // {
      //     $in: ["CANCELLED","ACCEPTED","ONBOARDED",
      //     "ASSIGNED",
      //     "STARTED",
      //     "ARRIVED",
      //     "PICKEDUP",
      //     "DROPPED",
      //     "COMPLETED",
      //     "EXPIRED",
      //     "SCHEDULED"]
      //     }

      const getTrips = await Booking.find({
        userId: userId,
        travel_status: travel_status,
      })
        .populate({
          path: "userId",
          select: "firstname lastname phone email",
        })
        .populate({
          path: "routeId",
          select: "title",
        })
        .populate({
          path: "pickupId",
          select: "title",
        })
        .populate({
          path: "dropoffId",
          select: "title",
        })
        .populate({
          path: "busId",
          select: "name model_no reg_no",
        })
        .populate({
          path: "passengerdetails",
        })
        .populate({ path: "userId", select: "firstname lastname phone" })
        .populate({ path: "payments", match: { payment_status: "Completed" } })
        .sort({
          booking_date: 1,
        })
        .skip(parseInt(offset))
        .limit(parseInt(limit));

      const refundssettings = await Setting.getrefunds();
      res.json({
        message: "my trip Successful",
        status: true,
        refund_alert: refundssettings.refunds.contents,
        data: await Utils.bookingtransformData(getTrips),
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "fetching failed",
        errorMessage: err.message,
      });
    }
  },
  generateQRTrip: async (req, res) => {
    try {
      const { userId, walletId } = req.session;
      const { pnr_no } = req.body;
      const getData = await Booking.findOne(
        {
          pnr_no,
          userId,
        },
        "_id has_return passengers seat_nos travel_status final_total_fare pnr_no",
      )
        .populate({
          path: "userId",
          select: "firstname lastname phone email",
        })
        .populate({
          path: "routeId",
          select: "title",
        })
        .populate({
          path: "pickupId",
          select: "title",
        })
        .populate({
          path: "dropoffId",
          select: "title",
        })
        .populate({
          path: "busId",
          select: "name model_no",
        })
        .lean();

      if (!getData.travel_status) {
        const qrData = `final_total_fare=${getData.final_total_fare}&pnr_no=${
          getData.pnr_no
        }&
          seat_nos=${getData.seat_nos}&travel_status=${
            getData.travel_status ? "Completed" : "Pending"
          }&bus_name=${getData.busId.name}&
          bus_model_no=${getData.busId.model_no}&
          passengers=${getData.passengers}&has_return=${
            getData.has_return ? "NO" : "YES"
          }&firstname=${getData.userId.firstname}&lastname=${
            getData.userId.lastname
          }&phone=${getData.userId.phone}`;

        const png_string = qr.imageSync(qrData, {
          type: "png",
        });
        res.json({
          message: "ti Successful",
          status: true,
          data: png_string.toString("base64"),
        });
      } else {
        const png_string = "";
        res.json({
          message: "ti Successful",
          status: true,
          data: png_string,
        });
      }
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "fetching failed",
        errorMessage: err.message,
      });
    }
  },
  addHomeOffice: async (req, res) => {
    try {
      const {
        home_lat,
        home_lng,
        home_address,
        home_timing,
        office_lat,
        office_lng,
        office_address,
        office_timing,
      } = req.body;
      const { userId, walletId } = req.session;

      if (
        await User.exists({
          _id: userId,
        })
      ) {
        const Obj = {
          places: {
            home: {
              address: home_address,
              coordinates: [parseFloat(home_lng), parseFloat(home_lat)],
              timing: await Utils.joinDateTime(home_timing),
            },
            office: {
              address: office_address,
              coordinates: [parseFloat(office_lng), parseFloat(office_lat)],
              timing: await Utils.joinDateTime(office_timing),
            },
          },
        };
        const updateUser = await User.findOneAndUpdate(
          {
            _id: userId,
          },
          Obj,
          {
            returnDocument: "after",
          },
        );
        res.json({
          message: "Add home and office details",
          status: true,
          data: await User.formatedData(updateUser),
        });
      }
    } catch (err) {
      res.status(400).json({
        status: false,
        message: "Unable to added home and office",
        detail: ".",
        errorMessage: err.message,
      });
    }
  },
  logout: async (req, res) => {
    try {
      const requestData = req.session;
      await Utils.verifyToken(requestData.token);
      res.json({
        message: "Logout Successful",
        status: true,
        detail: "Successfuly expired login session",
      });
    } catch (err) {
      res.status(400).json({
        status: false,
        message: "Logout Failed",
        detail: "Something went wrong during the logout process.",
        errorMessage: err.message,
      });
    }
  },
  userDelete: async (req, res) => {
    try {
      const { userId } = req.session;

      const deletedUser = await User.findByIdAndUpdate(
        userId,
        {
          is_deleted: true,
          status: false,
          deletedAt: new Date(),
        },
        { returnDocument: "after" },
      );
      await Session.expireAllTokensForUser(userId);
      res.clearCookie("token");

      // Enqueue job for further processing (e.g., permanent deletion after grace period of 30 days)
      const delay = 30 * 24 * 60 * 60 * 1000; // 30 days
      await enqueueDeleteUser({ userId: userId }, { delay });

      res.json({
        status: true,
        message: "Successfully authenticated user",
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: err.message,
      });
    }
  },
  track: async (req, res) => {
    try {
      const { pnr_no } = req.body;
      const date = await userService.bookingTrack(pnr_no);
      res.json({
        message: "track Successful",
        status: true,
        data: date,
      });
    } catch (err) {
      res.status(200).json({
        status: false,
        message: "Something went wrong during registration process.",
        errorMessage: err.message,
      });
    }
  },
  invoiceGenerate: async (req, res) => {
    try {
      const pnr_no = req.params.pnr_no;
      const data = await userService.invoiceGenerate(pnr_no, res);
      if (data === false) {
        return res.status(404).json({
          status: false,
          message: "Invoice not found or PNR invalid.",
        });
      }
      if (typeof data === "string" && data.startsWith("err while :")) {
        return res.status(500).json({
          status: false,
          message: "Error generating invoice.",
          errorMessage: data,
        });
      }
      return data;
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Something went wrong during invoice generation.",
        errorMessage: err.message,
      });
    }
  },
};
