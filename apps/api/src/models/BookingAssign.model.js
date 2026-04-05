const mongoose = require("mongoose");
const { Schema } = mongoose;
const moment = require("moment-timezone");
const { ObjectId } = Schema;
// Import models directly to avoid circular dependency
const Driver = require("./Driver.model");
const Ticket = require("./Ticket.model");
const RouteStop = require("./RouteStop.model");
const Booking = require("./Booking.model");
const _ = require("lodash");

const bookingAsignSchema = new Schema(
  {
    adminId: { type: ObjectId, ref: "Admin", required: false },
    routeId: { type: ObjectId, ref: "Route", required: true },
    driverId: { type: ObjectId, ref: "Driver", required: true },
    busScheduleId: { type: ObjectId, ref: "Bus_Schedule" },
    assistantId: { type: [ObjectId], ref: "Driver" },
    dates: { type: [Date], index: true },
    status: { type: Boolean, default: false },
    angle: { type: String, default: "0" },
    location: {
      type: { type: String, default: "Point" },
      address: { type: String, default: "" },
      coordinates: [Number],
      time_created: { type: Number, default: 0 },
    },
    trip_status: {
      type: String,
      enum: [
        "ASSIGNED",
        "EXPIRED",
        "STARTED",
        "COMPLETED",
        "NOTSTARTED",
        "RIDING",
      ],
      default: "ASSIGNED",
    },
  },
  {
    timestamps: true,
  },
);

bookingAsignSchema.index({ location: "2dsphere" });

bookingAsignSchema.methods.validateTripStart = function (
  schedule,
  bufferMinutes,
) {
  if (!schedule) {
    return { status: true };
  }

  const departure_time = schedule.departure_time;
  const current_time = moment().tz(global.DEFAULT_TIMEZONE);
  const today = current_time.clone().startOf("day");

  // Check if today is in the scheduled dates
  const isTodayScheduled = (this.dates || []).some((d) =>
    moment(d).tz(global.DEFAULT_TIMEZONE).startOf("day").isSame(today),
  );

  if (!isTodayScheduled) {
    const futureDates = (this.dates || [])
      .map((d) => moment(d).tz(global.DEFAULT_TIMEZONE).startOf("day"))
      .filter((d) => d.isAfter(today))
      .sort((a, b) => a - b);

    if (futureDates.length > 0) {
      const nextDate = futureDates[0].format("DD MMM YYYY");
      const departure_time_str = moment()
        .startOf("day")
        .add(departure_time, "minutes")
        .format("hh:mm A");
      return {
        status: false,
        message: `Today is not a scheduled day for this trip. Your next trip is scheduled for ${nextDate} at ${departure_time_str}.`,
      };
    }

    return {
      status: false,
      message: "No scheduled dates found for this trip assignment.",
    };
  }

  const current_minutes = current_time.hours() * 60 + current_time.minutes();

  if (current_minutes < departure_time - bufferMinutes) {
    const allowed_start_time = moment()
      .startOf("day")
      .add(departure_time - bufferMinutes, "minutes")
      .format("hh:mm A");
    return {
      status: false,
      message: `You can start this trip only after ${allowed_start_time} (${bufferMinutes} minutes before departure).`,
    };
  }

  if (current_minutes > departure_time + bufferMinutes) {
    const futureDates = (this.dates || [])
      .map((d) => moment(d).tz(global.DEFAULT_TIMEZONE).startOf("day"))
      .filter((d) => d.isAfter(today))
      .sort((a, b) => a - b);

    if (futureDates.length > 0) {
      const nextDate = futureDates[0].format("DD MMM YYYY");
      const allowed_start_time = moment()
        .startOf("day")
        .add(departure_time - bufferMinutes, "minutes")
        .format("hh:mm A");
      const departure_time_str = moment()
        .startOf("day")
        .add(departure_time, "minutes")
        .format("hh:mm A");

      return {
        status: false,
        message: `Your next trip is scheduled for ${nextDate} at ${departure_time_str}. You can start that trip after ${allowed_start_time} (${bufferMinutes} minutes before departure).`,
      };
    }

    return {
      status: false,
      message: "This trip's scheduled time has passed for today.",
    };
  }
  return { status: true };
};
//assistant
//

bookingAsignSchema.statics = {
  async isExistAssign(assignId) {
    return await this.exists({ _id: assignId });
  },
  transformStatus(item) {
    if (item.trip_status === "RIDING") {
      return {
        trip_status: item.trip_status,
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0],
        assignId: item._id,
        angle: item.angle,
        next_stop:
          Object.keys(item.stop).length > 0
            ? {
                lat: item.stop.location.coordinates[1].toString(),
                lng: item.stop.location.coordinates[0].toString(),
                title: item.stop.location.title,
              }
            : {
                lat: "",
                lng: "",
                title: "",
              },
      };
    } else {
      return {
        trip_status: item.trip_status,
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0],
        assignId: item._id,
        angle: item.angle,
        next_stop: {
          lat: "",
          lng: "",
          title: "",
        },
      };
    }
  },
  async transformData(item) {
    let passenger_total = 0;
    let date = moment(item.dates[0]).tz(DEFAULT_TIMEZONE).format("YYYY-MM-DD");
    let stops = await RouteStop.transformStopPassengerData(
      item.routeId._id,
      item.routeId.routestops.stops,
      date,
    );
    passenger_total = await Booking.totalPassengers(item.routeId._id, date);

    return {
      assignId: item._id,
      status: item.status,
      passenger_total,
      date,
      time: moment(item.timetables.time).tz(DEFAULT_TIMEZONE).format("hh:mm A"),
      assistants: item.assistantId ? item.assistantId : [{}],
      routeId: item.routeId._id,
      route_name: item.routeId.title,
      trip_status: item.trip_status,
      bus_model_no: item.timetables.busId.model_no,
      bus_reg_no: item.timetables.busId.reg_no,
      // bus_model_no:item.busId.model_no,
      // bus_reg_no:item.busId.reg_no,
      stops: _.sortBy(stops, ["order"], ["asc"]),

      // passenger_count:passenger_count

      // routeId: item.ticketId.routeId,
      // ticketId: item.ticketId._id,
      // ticket_name: item.ticketId.name,
      // ticket_start_at: item.ticketId.start_at,
      // ticket_end_at: item.ticketId.end_at,
      // ticket_total_seat_count: item.ticketId.seat_count,
      // ticket_total_seat_remain: item.ticketId.seat_remain,
      // ticket_total_seat_booked: item.ticketId.seat_booked,
      // ticket_status: item.ticketId.status,
      //  routestops: item.ticketId.routestops.stops,
    };
  },
};

module.exports = mongoose.model("BookingAssign", bookingAsignSchema);
