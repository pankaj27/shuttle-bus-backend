const Utils = require("../utils/utils");
const { driverService } = require("../services");
const { Driver, Booking, Session } = require("../models");

module.exports = {
  login: async (req, res) => {
    try {
      const { phone, country_code } = req.body;
      const userExist = await Driver.findOne({
        phone,
        country_code,
        status: true,
      });
      if (!userExist) {
        res.status(200).json({
          title:
            "Driver not found. Please contact support to add your information.",
          status: false,
          message: "Driver not found",
        });
      } else {
        const otp = await Utils.generatingOTP(100000, 999999);
        await Utils.sendSMS(
          `${country_code}${phone}`,
          otp,
          undefined,
          `Your OTP for ${global.DEFAULT_APPNAME || "Shuttle Bus"} (Driver) is ${otp}. Please do not share this with anyone.`,
        );
        await Driver.findByIdAndUpdate(userExist._id, { otp });

        const userId = userExist._id;
        const session = await Utils.initSession(phone, userId, "", "Driver");
        res.status(200).json({
          message: "OTP sent to your mobile number.",
          status: true,
          flag: 0, // flag 0 for OTP verification required
          otp: otp, // Included for development/testing as per current pattern in resendOTP
          baseurl: process.env.BASE_URL,
          csrfToken: session.csrfToken,
          token: session.token,
          is_demo: process.env.DEMO_MODE === "true",
        });
      }
    } catch (err) {
      res.status(200).json({
        status: false,
        title: "Login Error",
        message: "Something went wrong during registration process.",
        errorMessage: err.message,
      });
    }
  },
  refresh: async (req, res) => {
    try {
      const { phone, csrfToken, onModel } = req.body;
      const session = await Utils.refreshDriverToken(phone, csrfToken, onModel);
      if (session) {
        res.status(200).json({
          status: true,
          message: "token updated successfully.",
          data: {
            token: session.token,
            csrfToken: session.csrfToken,
          },
        });
      } else {
        res.status(200).json({
          status: false,
          message: "csrf Token or phone is not valid.",
        });
      }
    } catch (err) {
      res.status(400).json({
        status: false,
        title: "Error while",
        message: "Something went wrong during refresh token.",
        errorMessage: err,
      });
    }
  },
  verifyOTP: async function (req, res) {
    try {
      const { otp, device_token, device_type, device_info } = req.body;
      const { userId } = req.session;

      const isVerified = await driverService.verifyOTPExists(userId, otp);

      if (isVerified) {
        const driverData = await driverService.updateOne(userId, {
          otp: null, // clear OTP after successful verification
          is_mobile_verified: true,
          device_token,
          device_type,
          device_info,
        });
        res.json({
          status: true,
          userDetail: await Driver.transform(driverData),
          is_demo: process.env.DEMO_MODE === "true",
          message: "OTP verify successful",
        });
      } else {
        res.json({
          status: false,
          message: "OTP not matched.",
        });
      }
    } catch (err) {
      res.status(401).json({
        message: "Error verifying OTP",
        status: false,
        errorMessage: err.message,
      });
    }
  },
  reSendOTP: async (req, res) => {
    try {
      const { phone } = req.body;
      const { userId } = req.session;
      const userExist = await Driver.exists({
        phone: phone,
      });

      if (userExist) {
        const otp = await Utils.generatingOTP(100000, 999999);
        const updateuser = await Driver.findOneAndUpdate(
          {
            phone: phone,
          },
          {
            otp,
          },
          {
            returnDocument: "after",
          },
        );
        await Utils.sendSMS(
          `${updateuser.country_code}${phone}`,
          otp,
          undefined,
          `Your OTP for ${global.DEFAULT_APPNAME || "Shuttle Bus"} (Driver) is ${otp}. Please do not share this with anyone.`,
        ); // send otp via textlocal

        res.status(200).json({
          message: "resend OTP Successful.",
          status: true,
          otp: updateuser.otp,
        });
      } else {
        res.json({
          status: false,
          message: "phone number not exists.",
        });
      }
    } catch (err) {
      res.status(401).json({
        message: "Error resending OTP",
        status: false,
        errorMessage: err.message,
      });
    }
  },
  driverDelete: async (req, res) => {
    try {
      const { userId } = req.session;

      const deletedDriver = await Driver.findByIdAndUpdate(
        userId,
        {
          is_deleted: true,
          status: false,
        },
        { returnDocument: "after" },
      );
      await Session.expireAllTokensForUser(userId);
      res.clearCookie("token");

      res.json({
        status: true,
        message: "Successfully authenticated driver",
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: err.message,
      });
    }
  },
  updateLocation: async (req, res) => {
    try {
      const { userId } = req.session;
      const { address, lat, lng, angle } = req.body;
      await driverService.updateLocation(userId, lat, lng, address, angle);
      res.status(200).json({
        status: true,
        message: "Location updated successfully",
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "location not updated",
        errorMessage: err.message,
      });
    }
  },
  updateLang: async (req, res) => {
    try {
      const { language } = req.body;
      const { userId } = req.session;
      await Driver.findByIdAndUpdate(
        userId,
        { language },
        { returnDocument: "after", upsert: true },
      );
      res.status(200).json({
        status: true,
        message: "Language updated successfully.",
      });
    } catch (err) {
      res.send(err);
    }
  },
  getDriver: async (req, res) => {
    try {
      const { userId } = req.session;
      const userExist = await Driver.findOne({
        _id: userId,
      });
      res.status(200).json({
        status: true,
        message: "Driver found",
        is_demo: process.env.DEMO_MODE === "true",
        data: await Driver.transform(userExist),
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "Cannot find driver",
        errorMessage: err.message,
      });
    }
  },
  updateDriver: async (req, res) => {
    try {
      const { firstname, lastname, email, phone } = req.body;
      const { userId } = req.session;
      const driverexists = await Driver.findOne({
        _id: userId,
      });
      if (driverexists) {
        const objUpdate = {
          firstname: firstname,
          lastname: lastname,
          email: email,
          phone: phone,
        };
        const updatedriver = await Driver.findByIdAndUpdate(
          userId,
          {
            $set: objUpdate,
          },
          {
            returnDocument: "after",
          },
        );
        res.status(200).json({
          status: true,
          message: "Driver updated",
          data: updatedriver.transform(),
        });
      } else {
        res.status(200).json({
          status: false,
          message: "Driver not found.",
        });
      }
    } catch (err) {
      res.status(401).json({
        status: false,
        message: "Cannot update driver",
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
  notification: async (req, res) => {
    try {
      const requestData = req.session;
      const getNotify = await driverService.getNotifications(
        requestData.userId,
      );
      res.json({
        message: "Notification fetch Successful",
        status: true,
        data: getNotify,
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
  updateNotification: async (req, res) => {
    try {
      const result = await driverService.updateNotifications(
        req.params.notifyId,
        req.params.read,
      );
      if (result.n > 0) {
        res.json({
          message: "Notification update Successful",
          status: true,
        });
      } else {
        res.json({
          message: "Notification failed",
          status: false,
        });
      }
    } catch (err) {
      res.status(400).json({
        status: false,
        message: "Logout Failed",
        detail: "Something went wrong during the logout process.",
        errorMessage: err.message,
      });
    }
  },
  passengerList: async (req, res) => {
    try {
      const busId = req.body.busId;
      const booking = await Booking.find({
        busId: busId,
      })
        .populate("passengerdetails")
        .lean();
      var passengers = [];
      booking.forEach((data) => {
        var pass = [];
        // passengers.push(data.passengerdetails);
        data.passengerdetails.forEach((item) => {
          pass.push({
            fullname: item.fullname,
            seat: item.seat,
          });
        });
        passengers.push(pass);
      });
      res.status(200).json({
        status: true,
        message: "Passenger List Found",
        data: passengers,
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "Could not find passenger list",
        ErrorMessage: err.message,
      });
    }
  },
};
