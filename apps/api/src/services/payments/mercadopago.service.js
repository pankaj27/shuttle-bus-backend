const {
  MercadoPagoConfig,
  Preference,
  Payment: MPPayment,
} = require("mercadopago");
const { paymentGateway } = require("../../utils/utils");
const {
  Payment,
  UserNotification,
  Booking,
  BookingLog,
} = require("../../models");
const { walletService, bookingService } = require("../../services");
const moment = require("moment-timezone");
const { user } = require("../../notifications");
const { HelperCustom } = require("../../helpers");
const { enqueueSendSMS } = require("../../queues/sms.queue");
const mongoose = require("mongoose");

let client = null;

const authenticate = async () => {
  try {
    const settings = await paymentGateway("Mercadopago");
  
    if (settings && settings.access_token) {
      client = new MercadoPagoConfig({
        accessToken: settings.access_token,
        options: { timeout: 10000 }, // ensures options property is not null
      });
      console.log("Mercadopago Auth: Authenticated successfully");
    } else {
      console.error(
        "Mercadopago Auth: access_token not found in settings for 'Mercadopago'",
        settings,
      );
    }
    return client;
  } catch (err) {
    console.error("Mercadopago Auth: Authentication error", err);
    return null;
  }
};

authenticate();

/**
 * Payment initiate
 * @param amount
 * @param userDetail
 * **/
const initiatePay = async (amount, userDetail) => {
  try {
    console.log("MercadoPago: initiatePay for amount:", amount);
    if (!client) {
      console.log("MercadoPago: Client null, authenticating...");
      await authenticate();
    }
    if (!client) {
      console.error("MercadoPago: Client still null");
      throw new Error("MercadoPago client is not initialized.");
    }

    const preference = new Preference(client);
    console.log("MercadoPago: Preference object initialized");

    const currencyCode = global.DEFAULT_CURRENCY_CODE || "BRL";
    console.log("MercadoPago: Using currency:", currencyCode);

    const baseUrl = process.env.BASE_URL
      ? process.env.BASE_URL.endsWith("/")
        ? process.env.BASE_URL
        : process.env.BASE_URL + "/"
      : "http://localhost:3001/";

    // Encode parameters to ensure back_urls are valid
    const type = encodeURIComponent(userDetail.type || "wallet");
    const payment_name = encodeURIComponent(
      userDetail.payment_name || "Mercadopago",
    );
    const orderIdParam = encodeURIComponent(
      userDetail.orderId || userDetail.pnr_no || "order_" + Date.now(),
    );

    const successUrl = `${baseUrl}api/payments/verify?type=${type}&payment_name=${payment_name}&order=${orderIdParam}`;

    console.log("MercadoPago: Final successUrl =", successUrl);

    const body = {
      items: [
        {
          id: String(
            userDetail.orderId || userDetail.pnr_no || "wallet_recharge",
          ),
          title: String(userDetail.description || "Shuttle Payment"),
          quantity: 1,
          unit_price: Number(amount),
          currency_id: currencyCode,
        },
      ],
      payer: {
        name: String(userDetail.firstname || "Test"),
        surname: String(userDetail.lastname || "User"),
        email: String(userDetail.email || "test_user@test.com"), // MUST use a Test User email from MP Dashboard
        phone: {
          area_code: String(userDetail.country_code || "55").replace(/\D/g, ""),
          number: String(userDetail.phone || "999999999").replace(/\D/g, ""),
        },
      },
      back_urls: {
        success: successUrl,
        failure: successUrl,
        pending: successUrl,
      },
      auto_return: "approved",
      external_reference: String(userDetail.orderId || userDetail.pnr_no),
      metadata: {
        type: userDetail.type,
        orderId: userDetail.orderId,
        ferriOrderId: userDetail.orderId,
        booking_pnr_no: userDetail.pnr_no || "",
        bookingLogId: userDetail.bookingLogId
          ? userDetail.bookingLogId.toString()
          : "",
        userId: userDetail._id ? userDetail._id.toString() : "",
      },
    };

    console.log(
      "MercadoPago: Preference body JSON:",
      JSON.stringify(body, null, 2),
    );

    const response = await preference.create({ body });
    if (response && response.init_point) {
      return {
        codeStatus: true,
        short_url: response.init_point,
        id: response.id,
      };
    } else {
      return { codeStatus: false };
    }
  } catch (err) {
    console.error("MercadoPago initiatePay error:", err);
    return { codeStatus: false };
  }
};

const paymentVerification = async (query) => {
  try {
    if (!client) {
      console.log("MercadoPago: Verification starting, authenticating...");
      await authenticate();
    }
    if (!client) {
      console.error("MercadoPago: Client null during verification");
      return false;
    }

    const { payment_id, status, order } = query;
    console.log(
      "MercadoPago: Verifying payment_id:",
      payment_id,
      "status:",
      status,
    );

    if (status !== "approved" && status !== "success") {
      console.log("MercadoPago: status not approved:", status);
      return false;
    }

    const mpPayment = new MPPayment(client);
    const result = await mpPayment.get({ id: payment_id });
    console.log(
      "MercadoPago: Payment get result status:",
      result ? result.status : "null",
    );

    if (result && result.status === "approved") {
      const orderId = order || result.external_reference;
      const getPayment = await Payment.findOne({
        $or: [{ orderId: orderId }, { orderId: result.id.toString() }],
        payment_status: "Processing",
      })
        .populate({
          path: "userId",
          select: "device_token phone country_code",
        })
        .lean();

      if (!getPayment) return false;

      const updateObj = {
        paymentId: payment_id,
        payment_created: moment().tz(DEFAULT_TIMEZONE).unix(),
        payment_status: "Completed",
        passed: status,
        currency_code: result.currency_id,
        payment_details: result,
      };

      if (getPayment.payment_type === "wallet") {
        await Payment.findOneAndUpdate({ _id: getPayment._id }, updateObj);
        await walletService.updateBalance(getPayment);
        return true;
      } else if (getPayment.payment_type === "trip") {
        const bookingId = getPayment.bookingId[0];
        await Payment.findOneAndUpdate({ _id: getPayment._id }, updateObj);
        const updateBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { travel_status: "SCHEDULED" },
          { returnDocument: "after" },
        );

        if (getPayment.userId && getPayment.userId.device_token) {
          const title = "Booking Confirmed";
          const bookingDate = moment(
            `${updateBooking.start_date} ${updateBooking.start_time}`,
          ).format(`${DEFAULT_DATEFORMAT} ${DEFAULT_TIMEFORMAT}`);
          const content = `Thank you for booking the ${DEFAULT_APPNAME} for ${bookingDate}. Your PNR number is ${updateBooking.pnr_no}. Please show your ticket QR code to the driver when boarding. We will send you the driver's details in the ticket when the shuttle's trip begins.`;
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

          const payload = {
            template_id: "69132272c353dd2e57686cba",
            mobiles: `${getPayment.userId.country_code ?? "91"}${getPayment.userId.phone}`,
            bookingDate: bookingDate,
            pnrno: updateBooking.pnr_no,
          };
          await enqueueSendSMS(payload);
        }
        return true;
      } else if (getPayment.payment_type === "pass") {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
          const getBookingLog = await BookingLog.findById(
            getPayment.bookingLogId,
          )
            .session(session)
            .lean();

          if (getBookingLog) {
            const getBookingIds = await HelperCustom.generateSinglePass(
              getBookingLog.booking_date,
              "SCHEDULED",
              getBookingLog.payment_mode,
              getBookingLog.userId,
              getBookingLog.busId,
              getBookingLog.busScheduleId,
              getBookingLog.routeId,
              getBookingLog.pickupId,
              getBookingLog.dropoffId,
              getBookingLog.seat_no,
              getBookingLog.has_return,
              getBookingLog.passId,
              getBookingLog.pass_no_of_rides,
              getBookingLog.ip,
              session,
            );

            if (Array.isArray(getBookingIds)) {
              updateObj.bookingId = getBookingIds.map((id) => id.toString());
              await Payment.updateOne({ _id: getPayment._id }, updateObj, {
                session,
              });
              await session.commitTransaction();

              if (getPayment.userId && getPayment.userId.device_token) {
                const title = "Booking Confirmed";
                const startbookingDate = moment(getBookingLog.booking_date)
                  .tz(DEFAULT_TIMEZONE)
                  .format(DEFAULT_DATEFORMAT);
                const endbookingDate = moment(
                  startbookingDate,
                  DEFAULT_DATEFORMAT,
                )
                  .add("days", parseInt(getBookingLog.pass_no_of_rides))
                  .format(DEFAULT_DATEFORMAT);
                const content = `Thank you for booking the ${DEFAULT_APPNAME} for ${startbookingDate} to ${endbookingDate}. Please show your ticket QR code to the driver when boarding. We will send you the driver's details in the ticket when the shuttle's trip begins.`;
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
                  getPayment.userId._id.toString(),
                  {},
                );

                const payload = {
                  template_id: "6916d2baf03eac004005af54",
                  mobiles: `${getPayment.userId.country_code ?? "91"}${getPayment.userId.phone}`,
                  startDate: startbookingDate,
                  endDate: endbookingDate,
                };
                await enqueueSendSMS(payload);
              }
              return true;
            } else {
              await session.abortTransaction();
              return false;
            }
          } else {
            await session.abortTransaction();
            return false;
          }
        } catch (err) {
          await session.abortTransaction();
          return false;
        } finally {
          session.endSession();
        }
      }
    }
    return false;
  } catch (err) {
    console.error("MercadoPago paymentVerification error:", err);
    return false;
  }
};

module.exports = {
  initiatePay,
  paymentVerification,
};
