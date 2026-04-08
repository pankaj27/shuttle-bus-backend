const Setting = require("../models/Settings.model");
const Wallet = require("../models/Wallet.model");
const Payment = require("../models/Payment.model");
const Session = require("../models/Session.model");
const User = require("../models/User.model");
const Pass = require("../models/Pass.model");
const BookingAssign = require("../models/BookingAssign.model");
const PaymentGateway = require("../models/PaymentGateway.model");
const { HelperTimeZone } = require("../helpers");
const Razorpay = require("razorpay");
const twilio = require("twilio");
const axios = require("axios");
const moment = require("moment-timezone");
const qr = require("qr-image");
const { template } = require("lodash");

const paymentGateway = async (site) => {
  try {
    const getPayment = await PaymentGateway.find({ site });
    const convertedObject = {};

    getPayment.forEach((item) => {
      convertedObject[item.name] = item.value;
    });
    return convertedObject;
  } catch (err) {
    return err;
  }
};

const sendSMS = async (phone, otp, templateId, message) => {
  // Handle both object-based payload (from workers) and positional arguments (from controllers)
  let targetPhone = phone;
  let targetOtp = otp;
  let targetTemplateId = templateId;
  let targetMessage = message;

  if (typeof phone === "object" && !otp) {
    targetPhone = phone.phone || phone.numbers || phone.mobiles;
    targetOtp = phone.otp || phone.token;
    targetTemplateId = phone.template_id || phone.templateId || phone.flow_id;
    targetMessage = phone.message || phone.body || targetOtp;
  }

  // Fallback for positional calls where message is missing
  if (!targetMessage) targetMessage = targetOtp;

  const setting = await getSetting();
  const sms = setting && typeof setting === "object" ? setting.sms : undefined;

  if (!sms || !sms.name || sms.name === "demoMode") return false;

  const provider = sms.name.toLowerCase();

  // 1. Firebase SMS (Usually handled client-side for OTP)
  if (provider === "firebase" && sms.firebase.is_enabled) {
    return true;
  }

  // 2. Msg91 SMS
  if (provider === "msg91" && sms.msg91.is_enabled) {
    const { key, senderId } = sms.msg91;
    const mobiles = String(targetPhone || "").replace(/[^\d]/g, "");
    const businessName =
      setting?.general?.name || global.DEFAULT_APPNAME || "Shuttle Bus";
    const timing = String(setting?.notifications?.otp_expiry_minutes || 10);
    const payload = {
      template_id:
        targetTemplateId || (sms.msg91.templates && sms.msg91.templates[0]?.id),
      short_url: "0",
      realTimeResponse: "1",
      recipients: [
        {
          mobiles,
          otp: targetMessage,
          OTP: targetMessage,
          businessName,
          timing,
          autodetect: "1",
        },
      ],
      sender: senderId,
    };
    try {
      const res = await axios.post(
        "https://control.msg91.com/api/v5/flow/",
        payload,
        {
          headers: { authkey: key, "Content-Type": "application/json" },
        },
      );
      return !!res?.data;
    } catch (err) {
      console.error("Msg91 Error:", err.response?.data || err.message);
      return false;
    }
  }

  // 3. Twilio SMS
  if (provider === "twilio" && sms.twilio.is_enabled) {
    const { sid, token, phone_number } = sms.twilio;
    const client = twilio(sid, token);
    try {
      const message = await client.messages.create({
        body: targetMessage,
        from: phone_number,
        to: targetPhone,
      });
      return !!message.sid;
    } catch (err) {
      console.error("Twilio Error:", err.message);
      return false;
    }
  }

  return false;
};

const configRazorPay = async () => {
  const getsetting = await getSetting();
  const ferriOrderId = await generateOrderID("Ferri");
  if (getsetting.payments) {
    const is_production = getsetting.payments.is_production;
    var status = "";
    if (is_production) {
      // is_production is true
      status = "LIVE";
      let razor = new Razorpay({
        key_id: getsetting.payments.key, // process.env.RAZOR_KEY_ID,
        key_secret: getsetting.payments.secret, // process.env.RAZOR_KEY_SECRET,
      });
      return {
        status,
        payment_settings: getsetting.payments,
        razor,
        ferriOrderId,
      };
    } else {
      status = "TEST";
      let razor = new Razorpay({
        key_id: getsetting.payments.key, // process.env.RAZOR_KEY_ID,
        key_secret: getsetting.payments.secret, // process.env.RAZOR_KEY_SECRET,
      });
      return {
        status,
        payment_settings: getsetting.payments,
        razor,
        ferriOrderId,
      };
    }
  }
};

function generateOrderID(type) {
  const rand = Math.floor(1000000000 + Math.random() * 9999999999);
  if (type) {
    const name =
      type.charAt(0).toUpperCase() +
      "" +
      type.charAt(1).toUpperCase() +
      "" +
      type.charAt(2).toUpperCase();
    return name + rand;
  }
  return rand;
}

const initSession = async (phone, userId, walletId, onModel) => {
  const expiresIn = await HelperTimeZone.setExpiredTime(60, "days"); //"hours" //"minutes"

  const token = await Session.generateToken(userId, walletId, expiresIn);
  const csrfToken = await Session.generateCsrf();
  if (onModel == "User") {
    const session = new Session({
      token,
      csrfToken,
      phone,
      userId,
      walletId,
      expiresIn,
      onModel,
    });
    await session.save();
    return session;
  } else {
    const session = new Session({
      token,
      csrfToken,
      phone,
      userId,
      expiresIn,
      onModel,
    });
    await session.save();
    return session;
  }
};

const verifyToken = async (token) => {
  const decodeToken = await Session.verifyToken(token);
  await Session.expireAllTokensForUser(decodeToken.userId);
};

const refreshToken = async (phone, csrf, onModel) => {
  try {
    const refreshObject = await Session.findOneAndRemove({
      phone: phone,
      csrfToken: csrf,
    });
    if (refreshObject) {
      const userId = refreshObject.userId;
      const walletId = refreshObject.walletId;
      const onModel = refreshObject.onModel;
      const expiresIn = await HelperTimeZone.setExpiredTime(60, "days");
      const token = await Session.generateToken(userId, walletId, expiresIn);
      const csrfToken = await Session.generateCsrf();
      const session = new Session({
        token,
        csrfToken,
        phone,
        userId,
        walletId,
        expiresIn,
        onModel,
      });
      await session.save();
      return session;
    }
  } catch (err) {
    return err;
  }
};

const refreshDriverToken = async (phone, csrf, onModel) => {
  try {
    const refreshObject = await Session.findOne({
      phone: phone,
      csrfToken: csrf,
    });

    if (refreshObject) {
      const userId = refreshObject.userId;
      const onModel = refreshObject.onModel;
      const expiresIn = await HelperTimeZone.setExpiredTime(20, "days");
      const token = await Session.generateDriverToken(userId, expiresIn);
      const csrfToken = await Session.generateCsrf();
      const session = new Session({
        token,
        csrfToken,
        phone,
        userId,
        expiresIn,
        onModel,
      });
      await session.save();
      await Session.deleteOne({ _id: refreshObject._id });
      return session;
    }
  } catch (err) {
    return err;
  }
};

const updateReferAmount = async (amount, date, reffby, referFrom) => {
  try {
    const newcredit = {
      amount: amount,
      status: false,
      date_of_reg: new Date(),
      date_of_exp: date,
      referedto: referFrom,
    };
    if (await Wallet.exists({ refercode: reffby })) {
      const cref = await Wallet.updateOne(
        { refercode: reffby },
        { $push: { credit: [newcredit] } },
      );
      return cref;
    }
  } catch (err) {
    return err;
  }
};

const getSetting = async () => {
  try {
    const setting = await Setting.findOne({}).sort({ _id: -1 }).limit(1);
    return setting || {};
  } catch (err) {
    return {};
  }
};

const isEmail = (email) => {
  if (typeof email !== "string") {
    return false;
  }
  const emailRegex =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
  return emailRegex.test(email);
};

const isPhone = (phone) => {
  if (typeof phone !== "string") {
    return false;
  }
  const phoneRegex = /^[7-9]\d{9}$/;
  return phoneRegex.test(phone);
};

const generatingOTP = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

// const referMoney = async(referedby) => {
//     const wallet = await Wallet.findOne({ refercode: referedby });
//     wallet.money = wallet.money + 20;
//     await wallet.save();
// };

const findDistance = (pickup, drop) => {
  const dlongitude = radians(drop[0] - pickup[0]);
  const dlatitude = radians(drop[1] - pickup[1]);
  const a =
    Math.sin(dlatitude / 2) * Math.sin(dlatitude / 2) +
    Math.cos(radians(pickup[1])) *
      Math.cos(radians(drop[1])) *
      Math.sin(dlongitude / 2) *
      Math.sin(dlongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = 6371 * c;
  return distance;
};

const radians = (deg) => {
  const tau = 2 * Math.PI;
  return (deg * tau) / 360;
};

const findDuration = (T2, T1) => {
  return minTostr(strTomin(T2) - strTomin(T1));
};

const strTomin = (t) => {
  const s = t.split(":");
  return Number(s[0]) * 60 + Number(s[1]);
};

const minTostr = (t) => {
  if (t === null || t === undefined) return "-";
  let h = Math.trunc(t / 60);
  let m = t % 60;
  let ampm = h >= 12 ? " pm" : " am";
  h = h % 12;
  h = h ? h : 12;
  return ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2) + ampm;
};

const findTotalFare = (X, k, y, tax, f) => {
  const Y = k * y;
  const P = tax / 100;
  const XY = X + Y;
  const Z = (XY * P + f).toFixed(2);
  const total = parseFloat(XY) + parseFloat(Z);
  return {
    total: total,
    tax: Z,
  };
};

const findBaseFare = (X, k, y) => {
  const Y = k * y;
  const XY = X + Y;
  return parseFloat(XY);
};

const referCode = (length, phone) => {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + phone;
  let charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/****
 * * X minium fare
 * * k distance
 *   y rate per km
 * * Y = ky
 * * tax
 * * fee
 * * pass
 * * r no of rides
 * rdiscount
 * ****/
const round2 = (num) => Math.round(num * 100) / 100;

const findTotalPassFare = (X, k, y, tax, fee, r, rdiscount) => {
  const Y = k * y; // distance fare
  const baseFare = X + Y;

  // Tax calculation
  const taxAmount = round2((baseFare * tax) / 100);

  // Total fee = fixed fee + tax
  const totalFee = round2(fee + taxAmount);

  // Discount per pass
  const discount = round2((baseFare * r) / rdiscount);

  // Single pass fare

  const singlePassFare = Math.round(baseFare + totalFee - discount);

  // Total for all rides
  const totalPassFare = Math.round(singlePassFare * r);

  // Total tax for all rides
  const totalTaxAmount = round2(taxAmount * r);
  const singlePassTax = round2(taxAmount);

  const singlePasssubtotal = round2(baseFare);
  const subtotalPass = round2(baseFare * r);

  return {
    singlePassFare,
    singlePassTax,
    totalPassFare,
    totalTaxAmount,
    singlePasssubtotal,
    subtotalPass,
  };
};

const joinDateTime = (time) => {
  const timing = time;
  const currentDate = moment().format("YYYY-MM-DD");
  const datetime = new Date(currentDate + " " + timing);
  return moment(datetime);
};

const getPassLists = async (minimum_fare, distance, tax, fee) => {
  try {
    var totalPassFares = [];
    const getleastPass = await Pass.find({ status: true }).lean();
    for (let pass of getleastPass) {
      const pass_price_per_km = parseFloat(pass.price_per_km);
      const pass_no_of_rides = parseInt(pass.no_of_rides);
      const pass_no_of_valid_days = parseInt(pass.no_of_valid_days);
      const pass_terms = pass.terms;
      const pass_description = pass.description;
      const pass_discount = parseInt(pass.discount);

      let rdiscount = hasOneDigit(pass_discount)
        ? pass_discount * 100
        : pass_discount * 10;
      let totalsingleFare = "";
      console.log("rdiscount", rdiscount);
      //  rdiscount = 100;
      totalsingleFare = await findTotalPassFare(
        minimum_fare,
        distance,
        pass_price_per_km,
        tax,
        fee,
        pass_no_of_rides,
        rdiscount,
      );

      totalPassFares.push({
        passId: pass._id,
        pass_no_of_rides,
        totalsingleFare: totalsingleFare.singlePassFare,
        totalFare: totalsingleFare.totalPassFare,
        totalTaxAmount: totalsingleFare.totalTaxAmount,
        singlePassSubtotal: totalsingleFare.singlePasssubtotal,
        subTotalPass: totalsingleFare.subtotalPass,
        singlePassTax: totalsingleFare.singlePassTax,
        pass_no_of_valid_days,
        pass_terms,
        pass_description,
      });
    }
    return totalPassFares;
  } catch (err) {
    return "err while :" + err;
  }
};

//const WEEKEND = [moment().tz(DEFAULT_TIMEZONE).day("Sunday").weekday(),moment().day("Saturday").weekday()]

const addBusinessDays1 = (currentDate, date, daysToAdd) => {
  var daysAdded = 0;
  var momentDate;
  if (currentDate === date) {
    momentDate = moment(new Date(date)).tz(DEFAULT_TIMEZONE);
  } else {
    const changeDate = moment(date)
      .subtract(1, "days")
      .tz(DEFAULT_TIMEZONE)
      .format("YYYY-MM-DD");
    momentDate = moment(new Date(changeDate)).tz(DEFAULT_TIMEZONE);
  }
  // momentDate = moment(new Date(date)).tz("Asia/kolkata");
  const WEEKEND = HelperTimeZone.weekend();
  while (daysAdded < daysToAdd) {
    momentDate = momentDate.add(1, "days");
    if (!WEEKEND.includes(momentDate.weekday())) {
      daysAdded++;
    }
  }
  return momentDate;
};

function hasOneDigit(val) {
  return String(Math.abs(val)).charAt(0) == val;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getSum(array, column) {
  if (array.length > 0) {
    let values = array.map((item) => parseInt(item[column]) || 0);
    return values.reduce((a, b) => a + b).toString();
  }
  return "0";
}

async function bookingtransformData(data) {
  try {
    var selectableItems = [];
    var png_string = "";
    for (const item of data) {
      var booking_assign = {};
      if (
        item.travel_status === "SCHEDULED" ||
        item.travel_status === "ONBOARDED"
      ) {
        const picture = item.userId.ProfilePic
          ? item.userId.ProfilePic
          : "default.jpg";

        const qrData = {
          final_total_fare: item.final_total_fare,
          pnr_no: item.pnr_no,
          bus_scheduledId: item.busscheduleId,
          seat_nos: item.seat_nos,
          travel_status: item.travel_status,
          bus_name: item.busId.name,
          bus_model_no: item.busId.model_no,
          bus_depature_date: moment(item.bus_depature_date)
            .tz(DEFAULT_TIMEZONE)
            .format("YYYY-MM-DD"),
          passengers: item.passengers,
          passengerdetails: item.passengerdetails.map((item) => {
            return {
              fullname: item.fullname,
              age: item.age,
              gender: item.gender,
              seat: extractContentInsideBrackets(item.seat),
            };
          }),
          has_return: item.has_return ? "NO" : "YES",
          firstname: item.userId.firstname,
          lastname: item.userId.lastname,
          phone: item.userId.phone,
          profile_picture: (await User.isValidURL(item.userId.ProfilePic))
            ? item.userId.ProfilePic
            : `${process.env.BASE_URL}public/users/profiles/${picture}`,
          payment_method: item.payments ? item.payments.method : "",
        };
        png_string = qr.imageSync(JSON.stringify(qrData), {
          type: "svg",
        });
      } else {
        png_string = "";
      }

      const paymentExists = await Payment.exists({
        bookingId: { $in: [item._id] },
      });
      if (paymentExists) {
        const OBj = {
          //id: item._id,
          passengerdetails: item.passengerdetails.map((item) => {
            return {
              fullname: item.fullname,
              age: item.age,
              gender: item.gender,
              seat: extractContentInsideBrackets(item.seat),
            };
          }),
          travel_status: item.travel_status,
          seat_nos: item.seat_nos,
          has_return: item.has_return ? "1" : "2",
          start_time: item.start_time,
          start_date: item.start_date,
          drop_date: item.drop_date ? item.drop_date : "",
          drop_time: item.drop_time ? item.drop_time : "",
          sub_total: item.sub_total,
          discount: item.discount ? item.discount : "0",
          bus_depature_date: item.bus_depature_date,
          tax_percent: item.tax,
          tax: item.tax_amount,
          fee: item.fee,
          final_total_fare: item.final_total_fare,
          pnr_no: item.pnr_no,
          passengers: item.passengers,
          routeId: item.routeId ? item.routeId._id : "-",
          route_name: item.routeId ? item.routeId.title : "-",
          pickupId: item.pickupId ? item.pickupId._id : "-",
          pickup_name: item.pickupId ? item.pickupId.title : "-",
          dropoffId: item.dropoffId ? item.dropoffId._id : "-",
          drop_name: item.dropoffId ? item.dropoffId.title : "-",
          busId: item.busId._id,
          bus_name: item.busId.name,
          bus_model_no: item.busId.reg_no,
          png_string: png_string.toString("base64"),
        };

        if (item.travel_status === "COMPLETED") {
          OBj.invoice_url = `${process.env.BASE_URL}api/users/invoice/${item.pnr_no}`;
        } else {
          OBj.invoice_url = "";
        }

        if (item.routeId) {
          const getdata = await checkDriver(
            item.routeId._id,
            item.bus_depature_date,
            item.travel_status,
          );
          if (getdata) {
            OBj.booking_assign = getdata;
          } else {
            OBj.booking_assign = {};
          }
        } else {
          OBj.booking_assign = {};
        }
        selectableItems.push(OBj);
      }
    }
    return selectableItems;
  } catch (err) {
    console.log("err", err);
    return [];
  }
}

/***
 * extrack bracket from string
 * **/
function extractContentInsideBrackets(inputString) {
  const startIndex = inputString.indexOf("[");
  const endIndex = inputString.indexOf("]");

  if (startIndex !== -1 && endIndex !== -1) {
    return inputString.substring(startIndex + 1, endIndex);
  } else {
    return inputString;
  }
}

async function checkDriver(routeId, tripDateTime, travel_status) {
  try {
    const currentDate = moment(tripDateTime)
      .tz(DEFAULT_TIMEZONE)
      .format("YYYY-MM-DD");
    const endDate = moment(tripDateTime).tz(DEFAULT_TIMEZONE).endOf("day");
    if (
      await BookingAssign.exists({
        routeId,
        date_time: { $gte: new Date(currentDate), $lte: new Date(endDate) },
      })
    ) {
      const getData = await BookingAssign.findOne({
        routeId,
        date_time: { $gte: new Date(currentDate), $lte: new Date(endDate) },
      })
        .populate({ path: "driverId", select: "firstname lastname phone" })
        .lean();
      if (getData) {
        if (travel_status === "SCHEDULED" || travel_status === "ONBOARDED") {
          return {
            driver_fullname:
              getData.driverId.firstname + " " + getData.driverId.lastname,
            driver_phone: getData.driverId.phone,
          };
        } else {
          return {};
        }
      } else {
        return {};
      }
    } else {
      return {};
    }
  } catch (err) {
    return false;
  }
}

function convertDateTimeToSec(date, time) {
  //'2022-05-16 09:34 AM'
  const curentTime = moment(new Date(date + " " + time))
    .tz(DEFAULT_TIMEZONE)
    .format("HH:mm:ss A");
  const convertSec = moment(curentTime, "HH:mm:ss: A").diff(
    moment().startOf("day"),
    "seconds",
  );
  return convertSec;
}

function transformRouteData(currentDate, data) {
  const selectableItems = [];
  data.forEach((item) => {
    const pickupTime = convertDateTimeToSec(
      currentDate,
      item.pickup_stop_departure_time,
    );
    const dropTime = convertDateTimeToSec(
      currentDate,
      item.drop_stop_arrival_time,
    );
    if (pickupTime <= dropTime) {
      var hold;
      if (item.drop_stop_order > item.pickup_stop_order) {
        hold = item.drop_stop_order - item.pickup_stop_order; // 4 -1 3
      } else {
        hold = item.pickup_stop_order - item.drop_stop_order;
      }

      selectableItems.push({
        routeId: item.routeId,
        route_name: item.route_name,
        route_busId: item.route_busId,
        total_of_stops: item.total_of_stops.toString(),
        route_bus_timetable: item.route_bus_timetable,
        holds: hold.toString(),
        pickup_stop_id: item.pickup_stop_id,
        pickup_stop_name: item.pickup_stop_name,
        pickup_stop_lat: item.pickup_stop_lat,
        pickup_stop_lng: item.pickup_stop_lng,
        pickup_stop_minimum_fare_pickup: item.pickup_stop_minimum_fare_pickup,
        pickup_stop_minimum_fare_drop: item.pickup_stop_minimum_fare_drop,
        pickup_stop_departure_time: item.pickup_stop_departure_time,
        pickup_distance: item.pickup_distance,
        drop_distance: item.drop_distance,
        drop_stop_id: item.drop_stop_id,
        drop_stop_id: item.drop_stop_id,
        drop_stop_name: item.drop_stop_name,
        drop_stop_order: item.drop_stop_order,
        drop_stop_lat: item.drop_stop_lat,
        drop_stop_lng: item.drop_stop_lng,
        drop_stop_minimum_fare_drop: item.drop_stop_minimum_fare_drop,
        drop_stop_price_per_km_drop: item.drop_stop_price_per_km_drop,
        drop_stop_arrival_time: item.drop_stop_arrival_time,
      });
    }
  });
  return selectableItems;
}

function normalizeSeat(input) {
  if (Array.isArray(input)) {
    return input.map((v) =>
      String(v)
        .trim()
        .replace(/^\[|\]$/g, ""),
    );
  }

  if (input === undefined || input === null) return "";

  return String(input)
    .trim()
    .replace(/^\[|\]$/g, "");
}

module.exports = {
  normalizeSeat,
  paymentGateway,
  hasOneDigit,
  transformRouteData,
  convertDateTimeToSec,
  bookingtransformData,
  getSum,
  capitalizeFirstLetter,
  findTotalPassFare,
  addBusinessDays1,
  getPassLists,
  joinDateTime,
  sendSMS,
  initSession,
  refreshToken,
  refreshDriverToken,
  verifyToken,
  referCode,
  updateReferAmount,
  getSetting,
  configRazorPay,
  isEmail,
  isPhone,
  generatingOTP,
  findDistance,
  radians,
  findDuration,
  strTomin,
  minTostr,
  findTotalFare,
  findBaseFare,
};
