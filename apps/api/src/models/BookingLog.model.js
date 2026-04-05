const mongoose = require("mongoose");
const moment = require("moment-timezone");

const BookingLogSchema = new mongoose.Schema(
  {
    userId: { type: Object, ref: "User", required: true },
    busScheduleId: { type: Object, ref: "BusSchedule", required: null },
    pickupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    dropoffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    passId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pass",
      default: null,
    },
    payment_mode: { type: String, default: "", index: true },
    seat_no: { type: String, default: "" },
    has_return: { type: Number, default: 0 },
    pass_no_of_rides: { type: Number, default: 0 },
    ip: { type: String, default: "" },
    total_amount: { type: Number, default: 0 },
    booking_date: { type: Date, default: null },
  },
  { timestamps: true },
);

BookingLogSchema.statics = {
  async createLog(
    booking_date,
    total_amount,
    payment_mode,
    userId,
    busId,
    busScheduleId,
    routeId,
    pickupId,
    dropoffId,
    seat_no,
    has_return,
    passId,
    pass_no_of_rides,
    ip,
    session = null,
  ) {
    try {
      const filter = {
        payment_mode,
        userId,
        busId,
	busScheduleId,
        routeId,
        pickupId,
        dropoffId,
        seat_no,
        has_return,
        passId,
        pass_no_of_rides,
        ip,
        total_amount,
        booking_date: new Date(booking_date),
      };

      if (!(await this.exists(filter).session(session))) {
        return new this(filter).save({ session });
      } else {
        return await this.findOne(filter).session(session);
      }
    } catch (err) {
      console.log("createLog error", err);
      return false;
    }
  },
};

module.exports = mongoose.model("Booking_log", BookingLogSchema);
