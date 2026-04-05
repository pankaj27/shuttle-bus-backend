const cron = require("node-cron");
// Import models directly to avoid circular dependency
const Booking = require("../models/Booking.model");
const BookingAssign = require("../models/BookingAssign.model");
const User = require("../models/User.model");
const Setting = require("../models/Settings.model");
const moment = require("moment-timezone");
const { user } = require("../notifications");

module.exports = {
  bookingCompletedTrip: async () => {
    const getSetting = await Setting.findOne({}, "general").lean();
    let DEFAULT_TIMEZONE = getSetting.general.timezone;
    cron.schedule(
      "*/1 * * * *",
      async function () {
        console.log(
          "******** Process running every BookingAssign minute *********",
        );
        // Only process recently completed trips (last 24h) to prevent history scan issues
        const cutoffTime = moment().subtract(1, "days").toDate();
        const getBookingAssign = await BookingAssign.find({
          trip_status: "COMPLETED",
          updatedAt: { $gte: cutoffTime },
        }).lean();

        if (getBookingAssign.length > 0) {
          getBookingAssign.forEach(async (trip, index) => {
            // Prefer specific date_time if available, else fallback to dates array
            let dateMatch;
            if (trip.date_time) {
              const dateStr = moment(trip.date_time)
                .tz(DEFAULT_TIMEZONE)
                .format("YYYY-MM-DD");
              dateMatch = new Date(dateStr);
            } else {
              dateMatch = { $in: trip.dates };
            }

            const getBookingOnboard = await Booking.find({
              travel_status: "ONBOARDED",
              busScheduleId: trip.busscheduleId,
              bus_depature_date: dateMatch,
            });
            if (getBookingOnboard) {
              getBookingOnboard.forEach(async (booking, index) => {
                const updateObj = {
                  travel_status: "COMPLETED",
                };
                const updateOne = await Booking.updateOne(
                  { _id: booking._id },
                  updateObj,
                );
                return updateOne;
              });
            }

            const getBookingSchedules = await Booking.find({
              travel_status: { $in: ["SCHEDULED", "PENDING"] },
              busScheduleId: trip.busscheduleId,
              bus_depature_date: dateMatch,
            });
            if (getBookingSchedules.length > 0) {
              getBookingSchedules.forEach(async (booking, index) => {
                const updateObj = {
                  travel_status: "EXPIRED",
                };
                const updateOne = await Booking.updateOne(
                  { _id: booking._id },
                  updateObj,
                );
                if (updateOne.n > 0) {
                  let getUser = await User.findById(booking.userId).select(
                    "device_token",
                  );
                  if (getUser && getUser.device_token) {
                    user.UserNotification(
                      "Trip Expired",
                      `Your trip is expired.`,
                      "",
                      getUser.device_token,
                    ); //title,message,data,token
                  }
                }
                return updateOne;
              });
            }
          });
        }
      },
      {
        timezone: DEFAULT_TIMEZONE,
      },
    );
  },
  bookingExpiredTrip: async () => {
    try {
      const getSetting = await Setting.findOne({}, "general").lean();
      let DEFAULT_TIMEZONE = getSetting.general.timezone;
      cron.schedule(
        "0 0 1 * * *",
        async function () {
          console.log(
            "******** Process running every minute for expired *********",
          );

          // Get current date in the configured timezone
          const todayDate = moment().tz(DEFAULT_TIMEZONE).format("YYYY-MM-DD");

          const getBooking = await Booking.find({
            // Expire bookings strictly BEFORE today (i.e. yesterday and older)
            bus_depature_date: { $lt: new Date(todayDate) },
            travel_status: { $in: ["SCHEDULED", "PROCESSING"] },
          });
          if (getBooking.length > 0) {
            getBooking.forEach(async (booking, index) => {
              const updateObj = {
                travel_status: "EXPIRED",
              };
              await Booking.updateOne({ _id: booking._id }, updateObj);
              // only update BookingAssign docs whose date_time is <= currentDate
              const filter = {
                routeId: booking.routeId,
                date_time: { $lt: new Date(todayDate) },
              };
              const updateObj2 = { $set: { trip_status: "EXPIRED" } };
              await BookingAssign.updateOne(filter, updateObj2);
            });
          }
        },
        {
          timezone: DEFAULT_TIMEZONE,
        },
      );
    } catch (err) {
      return err;
    }
  },
};
