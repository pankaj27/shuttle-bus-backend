const Flutterwave = require("flutterwave-node-v3");
const axios = require("axios");
const { paymentGateway, getSetting } = require("../../utils/utils");
const {
  Payment,
  Booking,
  BookingLog,
  Wallet,
  UserNotification,
  User,
} = require("../../models");
const { walletService, bookingService } = require("../../services");
const { HelperCustom } = require("../../helpers");
const moment = require("moment-timezone");
const { user } = require("../../notifications");

let flw = null;

const authenticate = async () => {
  const flwSetting = await paymentGateway("Flutterwave");
  if (flwSetting) {
    flw = new Flutterwave(flwSetting.key, flwSetting.secret);
  }
  return flw;
};

authenticate();

/**
 * Initiate Flutterwave Payment
 * @param {Number} amount
 * @param {Object} userDetail
 * @returns {Object|Boolean}
 */
const initiate = async (amount, userDetail) => {
  try {
    const flwSetting = await paymentGateway("Flutterwave");
    if (!flwSetting) return false;

    const appSetting = await getSetting();
    const generalSetting =
      appSetting && appSetting.general ? appSetting.general : {};

    const payload = {
      tx_ref: userDetail.orderId || `flw_${Date.now()}`,
      amount: amount,
      currency: generalSetting.default_currency || "USD",
      redirect_url: `${process.env.BASE_URL}/api/payments/flutterwave-callback`,
      meta: {
        userId: userDetail._id,
        type: userDetail.type,
      },
      customer: {
        email: userDetail.email,
        phonenumber: userDetail.phone || "",
        name: `${userDetail.firstname} ${userDetail.lastname}`,
      },
      customizations: {
        title: generalSetting.name || "App",
        logo: generalSetting.logo || "",
      },
    };

    const { data } = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      payload,
      {
        headers: {
          Authorization: `Bearer ${flwSetting.secret}`,
        },
      },
    );

    if (data && data.status === "success") {
      return {
        short_url: data.data.link,
        id: payload.tx_ref,
        codeStatus: true,
      };
    }
    return false;
  } catch (err) {
    console.error("Flutterwave initiation error:", err);
    return false;
  }
};

/**
 * Verify Flutterwave Payment
 * @param {String} transactionId
 * @param {String} orderId
 * @returns {Boolean}
 */
const verification = async (transactionId, orderId) => {
  try {
    if (!flw) await authenticate();

    const response = await flw.Transaction.verify({ id: transactionId });
    if (
      response &&
      response.status === "success" &&
      response.data.status === "successful"
    ) {
      const getPayment = await Payment.findOne({
        orderId,
        payment_status: "Processing",
      }).populate({ path: "userId", select: "device_token" });

      if (!getPayment) return false;

      const updateObj = {
        paymentId: transactionId,
        payment_created: moment(response.data.created_at)
          .tz(DEFAULT_TIMEZONE)
          .unix(),
        payment_status: "Completed",
        payment_details: response.data,
        method: response.data.payment_type,
        passed: response.data.status,
        currency_code: response.data.currency,
      };

      if (getPayment.payment_type === "wallet") {
        await Payment.findOneAndUpdate({ orderId }, updateObj);
        await walletService.updateBalance(getPayment);
        return true;
      }

      if (getPayment.payment_type === "trip") {
        const bookingId = getPayment.bookingId[0];
        await Payment.findOneAndUpdate({ orderId }, updateObj);
        const updateBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { travel_status: "SCHEDULED" },
          { returnDocument: "after" },
        );

        if (getPayment.userId && getPayment.userId.device_token) {
          const title = "Booking Confirmed";
          const bookingDate = moment(updateBooking.start_date).format(
            DEFAULT_DATEFORMAT,
          );
          const content = `Thank you for booking the ${DEFAULT_APPNAME} for ${bookingDate}. Your PNR number is ${updateBooking.pnr_no}.`;
          await user.UserNotification(
            title,
            content,
            "",
            getPayment.userId.device_token,
          );
          await UserNotification.create(
            "trip",
            title,
            content,
            getPayment.userId._id,
            {},
          );
        }
        return true;
      }

      if (getPayment.payment_type === "pass") {
        const getBookingLog = await BookingLog.findById(
          getPayment.bookingLogId,
        ).lean();
        if (getBookingLog) {
          const getBookingIds = await HelperCustom.generateSinglePass(
            getBookingLog.booking_date,
            "SCHEDULED",
            getBookingLog.payment_mode,
            getBookingLog.userId,
            getBookingLog.busId,
            getBookingLog.busscheduleId,
            getBookingLog.routeId,
            getBookingLog.pickupId,
            getBookingLog.dropoffId,
            getBookingLog.seat_no,
            getBookingLog.has_return,
            getBookingLog.passId,
            getBookingLog.pass_no_of_rides,
            getBookingLog.ip,
          );

          const ObjPayment = {
            bookingId: getBookingIds,
            bookingLogId: getBookingLog._id,
            paymentId: transactionId,
            payment_details: response.data,
            method: response.data.payment_type,
            passed: response.data.status,
            currency_code: response.data.currency,
            payment_created: moment(response.data.created_at)
              .tz(DEFAULT_TIMEZONE)
              .unix(),
            payment_status: "Completed",
          };

          await Payment.updateOne({ orderId }, ObjPayment);

          if (getPayment.userId && getPayment.userId.device_token) {
            const title = "Booking Confirmed";
            const startStr = moment(getBookingLog.booking_date)
              .tz(DEFAULT_TIMEZONE)
              .format(DEFAULT_DATEFORMAT);
            const content = `Thank you for booking your pass for ${DEFAULT_APPNAME} starting ${startStr}.`;
            await user.UserNotification(
              title,
              content,
              "",
              getPayment.userId.device_token,
            );
            await UserNotification.create(
              "trip",
              title,
              content,
              getPayment.userId._id,
              {},
            );
          }
        }
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("Flutterwave verification error:", err);
    return false;
  }
};

module.exports = {
  initiate,
  verification,
};
