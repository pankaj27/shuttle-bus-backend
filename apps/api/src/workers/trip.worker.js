const { Worker } = require("bullmq");
const { connection } = require("../config/redis");
const Booking = require("../models/Booking.model");
const BookingAssign = require("../models/BookingAssign.model");
const User = require("../models/User.model");
const Setting = require("../models/Settings.model");
const moment = require("moment-timezone");
const { user } = require("../notifications");

const concurrency = 1;

const tripWorker = new Worker(
  "trip",
  async (job) => {
    const getSetting = await Setting.findOne({}, "general").lean();
    const DEFAULT_TIMEZONE =
      getSetting?.general?.timezone || global.DEFAULT_TIMEZONE || "UTC";

    if (job.name === "daily-reset") {
      console.log("🕒 Running daily-reset job (12:05 AM)");
      const startOfToday = moment()
        .tz(DEFAULT_TIMEZONE)
        .startOf("day")
        .toDate();
      const endOfToday = moment().tz(DEFAULT_TIMEZONE).endOf("day").toDate();

      // Find all BookingAssign docs where today's date is in the dates array
      // and update trip_status to ASSIGNED
      const result = await BookingAssign.updateMany(
        {
          dates: { $elemMatch: { $gte: startOfToday, $lte: endOfToday } },
          trip_status: { $ne: "ASSIGNED" },
        },
        { $set: { trip_status: "ASSIGNED" } },
      );

      console.log(
        `✅ Daily reset complete. Updated ${result.modifiedCount} trips.`,
      );
      return result;
    }

    if (job.name === "daily-expiry") {
      console.log("🕒 Running daily-expiry job (1:00 AM)");
      const todayDate = moment().tz(DEFAULT_TIMEZONE).format("YYYY-MM-DD");
      const today = new Date(todayDate);

      const getBooking = await Booking.find({
        bus_depature_date: { $lt: today },
        travel_status: { $in: ["SCHEDULED", "PROCESSING"] },
      });

      if (getBooking.length > 0) {
        for (const booking of getBooking) {
          await Booking.updateOne(
            { _id: booking._id },
            { $set: { travel_status: "EXPIRED" } },
          );

          await BookingAssign.updateOne(
            {
              routeId: booking.routeId,
              date_time: { $lt: today },
            },
            { $set: { trip_status: "EXPIRED" } },
          );
        }
      }
      return { expiredCount: getBooking.length };
    }

    if (job.name === "minute-check") {
      // Logic migrated from bookingCompletedTrip
      const cutoffTime = moment().subtract(1, "days").toDate();
      const completedTrips = await BookingAssign.find({
        trip_status: "COMPLETED",
        updatedAt: { $gte: cutoffTime },
      }).lean();

      if (completedTrips.length > 0) {
        for (const trip of completedTrips) {
          let dateMatch;
          if (trip.date_time) {
            const dateStr = moment(trip.date_time)
              .tz(DEFAULT_TIMEZONE)
              .format("YYYY-MM-DD");
            dateMatch = new Date(dateStr);
          } else {
            dateMatch = { $in: trip.dates };
          }

          // Mark ONBOARDED as COMPLETED
          await Booking.updateMany(
            {
              travel_status: "ONBOARDED",
              busScheduleId: trip.busScheduleId,
              bus_depature_date: dateMatch,
            },
            { $set: { travel_status: "COMPLETED" } },
          );

          // Mark SCHEDULED/PENDING as EXPIRED
          const expiringBookings = await Booking.find({
            travel_status: { $in: ["SCHEDULED", "PENDING"] },
            busScheduleId: trip.busScheduleId,
            bus_depature_date: dateMatch,
          });

          for (const booking of expiringBookings) {
            await Booking.updateOne(
              { _id: booking._id },
              { $set: { travel_status: "EXPIRED" } },
            );

            const getUser = await User.findById(booking.userId).select(
              "device_token",
            );
            if (getUser?.device_token) {
              user.UserNotification(
                "Trip Expired",
                `Your trip has expired.`,
                "",
                getUser.device_token,
              );
            }
          }
        }
      }
      return { completedTripsProcessed: completedTrips.length };
    }
  },
  { connection, concurrency },
);

module.exports = { tripWorker };
