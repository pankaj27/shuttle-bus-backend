// Import models directly to avoid circular dependency
const Bus = require("../models/Bus.model");
const Ticket = require("../models/Ticket.model");
const Booking = require("../models/Booking.model");
const EventEmitter = require("events").EventEmitter;
const eventsListener = new EventEmitter();
const { user } = require("../notifications");
const moment = require("moment-timezone");

eventsListener.on("UPDATE-BOOKING-TICKET", async (ticketId, seatcount) => {
  try {
    if (await Ticket.exists({ _id: ticketId })) {
      const getTicket = await Ticket.findById(ticketId);
      if (getTicket) {
        const seat_remain =
          parseInt(getTicket.seat_remain) == 0
            ? parseInt(getTicket.seat_count) - parseInt(seatcount)
            : parseInt(getTicket.seat_remain) - parseInt(seatcount);
        const update = {
          seat_remain,
          seat_booked: parseInt(getTicket.seat_booked) + parseInt(seatcount),
        };
        const updateTickets = await Ticket.findOneAndUpdate(
          { _id: ticketId },
          update,
          { new: true },
        );
        return updateTickets;
      }
    }
  } catch (err) {
    return "error while : " + err;
  }
});

eventsListener.on("UPDATE-ALL-BOOKING-TICKET", async (bookingIds) => {
  try {
    const getBookings = await Booking.find({
      _id: { $in: bookingIds },
    }).populate({ path: "ticketId" });
    if (getBookings) {
      for (let booking of getBookings) {
        const seatcount = booking.seat_nos;
        const seat_remain =
          parseInt(booking.ticketId.seat_remain) == 0
            ? parseInt(booking.ticketId.seat_count) - parseInt(seatcount)
            : parseInt(booking.ticketId.seat_remain) - parseInt(seatcount);
        const update = {
          seat_remain,
          seat_booked:
            parseInt(booking.ticketId.seat_booked) + parseInt(seatcount),
        };

        const updateTickets = await Ticket.updateOne(
          { _id: booking.ticketId._id },
          update,
        );
      }
    }
  } catch (err) {
    return "error while : " + err;
  }
});

eventsListener.on(
  "NOTIFY-ALL-BOOKING-CUSTOMER",
  async (busscheduleId, assignDate) => {
    try {
      const startOfDay = moment(assignDate)
        .tz(global.DEFAULT_TIMEZONE)
        .startOf("day")
        .toDate();

      const getBooking = await Booking.find({
        busscheduleId,
        bus_depature_date: startOfDay,
        travel_status: "SCHEDULED",
      })
        .populate({
          path: "userId",
          select: "phone firstname lastname device_token",
        })
        .lean();

      if (getBooking && getBooking.length > 0) {
        const processedUsers = new Set();
        const tokens = [];

        for (const booking of getBooking) {
          if (
            booking.userId &&
            booking.userId.device_token &&
            !processedUsers.has(booking.userId._id.toString())
          ) {
            processedUsers.add(booking.userId._id.toString());
            tokens.push(booking.userId.device_token);
          }
        }

        if (tokens.length > 0) {
          user.MulticastNotification(
            "Trip Reminder",
            `Hey passengers, its time to board ${global.APP_NAME}. Track your bus for live update.`,
            "",
            tokens,
          );
        }
      }
    } catch (err) {
      console.error("Error in NOTIFY-ALL-BOOKING-CUSTOMER listener:", err);
    }
  },
);

exports.eventsListener = eventsListener;
