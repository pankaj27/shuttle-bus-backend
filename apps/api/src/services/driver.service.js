const {
  User,
  Driver,
  BookingAssign,
  Booking,
  RouteStop,
  Ticket,
  DriverNotification,
} = require("../models");
const { user } = require("../notifications");
const mongoose = require("mongoose");
const em = require("../events/listener");
const moment = require("moment-timezone");
const { enqueueDriverLocation } = require("../queues/driverLocation.queue");
const { enqueueNotification } = require("../queues/notification.queue");

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getDriverById = async (id) => {
  return await Driver.findById(id);
};

const verifyOTPExists = async (_id, otp) => {
  return await Driver.exists({ _id, otp });
};

const updateOne = async (id, updateBody) => {
  return await Driver.findByIdAndUpdate(id, updateBody);
};

const getTrips = async (driverId) => {
  try {
    const getData = await BookingAssign.findOne({
      driverId,
      trip_status: { $nin: ["COMPLETED", "EXPIRED"] },
    })
      .populate({
        path: "routeId",
        select: "title routeId",
        populate: { path: "routestops", select: "stops" },
        // populate: {
        //     path: "bookings",
        //     populate: { path: "payments" },
        //     populate: { path: "passengerdetails" }
        // }
      })
      .populate({ path: "assistantId", select: "firstname lastname phone" })
      .populate({
        path: "timetables",
        populate: {
          path: "busId",
          select: "model_no reg_no",
        },
      })
      .sort({ date_time: -1 })
      .lean();

    if (getData) {
      return BookingAssign.transformData(getData);
    }
    return false;
  } catch (err) {
    return "error while : " + err;
  }
};

const getBookings = async (bookingIds, stopId) => {
  try {
    const getBookingsList = await Booking.aggregate([
      {
        $match: {
          travel_status: { $in: ["SCHEDULED", "ONBOARDED"] },
          ...(bookingIds && Array.isArray(bookingIds) && bookingIds.length > 0
            ? {
                _id: {
                  $in: bookingIds.map((id) => new mongoose.Types.ObjectId(id)),
                },
              }
            : {}),
        },
      },
      {
        $lookup: {
          from: "payments",
          let: { bId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$$bId", { $ifNull: ["$bookingId", []] }] },
                    { $eq: ["$payment_status", "Completed"] },
                  ],
                },
              },
            },
          ],
          as: "payments",
        },
      },
      {
        $lookup: {
          from: "passengers",
          let: { bId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$bookingId", "$$bId"] },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
            },
          ],
          as: "passengers",
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          travel_status: 1,
          pnr_no: 1,
          final_total_fare: 1,
          payment_status: {
            $ifNull: [{ $arrayElemAt: ["$payments.payment_status", 0] }, ""],
          },
          passenger_status: {
            $cond: {
              if: {
                $eq: ["$pickupId", new mongoose.Types.ObjectId(stopId)],
              },
              then: "IN",
              else: "OUT",
            },
          },
          passengerdetails: {
            $cond: {
              if: { $gt: [{ $size: "$passengers" }, 0] },
              then: {
                $map: {
                  input: "$passengers",
                  as: "p",
                  in: {
                    travel_status: "$travel_status",
                    userId: "$$p.user._id",
                    customer_phone: "$$p.user.phone",
                    fullname: "$$p.fullname",
                    age: "$$p.age",
                    gender: "$$p.gender",
                    seat: "$$p.seat",
                  },
                },
              },
              else: [{}],
            },
          },
        },
      },
    ]);
    return getBookingsList;
  } catch (err) {
    return "error while : " + err;
  }
};

const updateBookingStatus = async (pnr_no, travel_status) => {
  try {
    const bookingChecking = await Booking.exists({
      pnr_no: pnr_no,
      travel_status: "SCHEDULED",
    });
    if (bookingChecking) {
      const update = await Booking.findOneAndUpdate(
        { pnr_no: pnr_no },
        { travel_status },
        { returnDocument: "after" },
      );
      const userId = update.userId;
      let getUser = await User.findById(userId).select("device_token");
      if (getUser && getUser.device_token) {
        if (travel_status == "ONBOARDED") {
          await enqueueNotification({
            title: "Trip Verified",
            message: `Your trip is now verified. enjoy your ${global.DEFAULT_APPNAME} trip.`,
            data: "",
            token: getUser.device_token,
          });
        } else {
          await enqueueNotification({
            title: "Booking status",
            message: `Your trip is now ${travel_status}.`,
            data: "",
            token: getUser.device_token,
          });
        }
      }
      return true;
    } else {
      return false;
    }
  } catch (err) {
    return "error while : " + err;
  }
};

const getNotifications = async (driverId) => {
  try {
    const notifications = await DriverNotification.aggregate([
      {
        $match: { driverId: new mongoose.Types.ObjectId(driverId) }, // if stored as ObjectId
        // If driverId is stored as string, use:
        // $match: { driverId: String(driverId) }
      },
      { $sort: { _id: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0, // remove if you want _id
          title: 1,
          content: 1,
          read: 1,
          created_at: {
            $dateToString: {
              timezone: global.DEFAULT_TIMEZONE,
              format: "%d-%m-%Y %H:%M",
              date: "$createdAt",
            },
          },
        },
      },
    ]);

    return notifications;
  } catch (err) {
    return "error while : " + err;
  }
};

const updateNotifications = async (notifyId, read) => {
  try {
    if (await DriverNotification.exists({ _id: notifyId })) {
      return await DriverNotification.updateOne({ _id: notifyId }, { read });
    }
  } catch (err) {
    return "error while : " + err;
  }
};

const assignTripStatus = async (assignId, trip_status, lat, lng, angle) => {
  try {
    if (await BookingAssign.isExistAssign(assignId)) {
      if (trip_status === "STARTED") {
        const checkTime =
          await BookingAssign.findById(assignId).populate("busScheduleId");

        if (checkTime) {
          const validation = checkTime.validateTripStart(
            checkTime.busScheduleId,
            global.STARTBOOKING_MINUTE || 0,
          );
          if (!validation.status) return validation;
        }
      }
      let update = {
        trip_status,
        angle,
        location: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
          time_created: moment().tz(global.DEFAULT_TIMEZONE).unix(),
        },
      };

      const originalAssign = await BookingAssign.findById(
        assignId,
        "trip_status routeId dates",
      );

      const getData = await BookingAssign.findOneAndUpdate(
        { _id: assignId },
        update,
        { returnDocument: "after" },
      );

      if (getData) {
        if (getData.trip_status === "COMPLETED") {
          getData.stop = {};
          return {
            status: true,
            message: "Trip completed successfully.",
            data: await BookingAssign.transformStatus(getData),
          };
        }

        // Only emit notification if the status is changing to STARTED
        if (
          getData.trip_status === "STARTED" &&
          originalAssign &&
          originalAssign.trip_status !== "STARTED"
        ) {
          const today = moment().tz(global.DEFAULT_TIMEZONE).startOf("day");
          const tripDate =
            getData.dates.find((d) =>
              moment(d)
                .tz(global.DEFAULT_TIMEZONE)
                .startOf("day")
                .isSame(today),
            ) || getData.dates[0];

          em.eventsListener.emit(
            "NOTIFY-ALL-BOOKING-CUSTOMER",
            getData.busScheduleId,
            tripDate,
          );
        }

        // Find Next Stop (For both STARTED and RIDING)
        const getStop = await RouteStop.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)],
              },
              maxDistance: 2000,
              distanceField: "actual_distance",
              spherical: true,
              includeLocs: "stops.location",
            },
          },
          {
            $match: { routeId: getData.routeId },
          },
          { $sort: { "stops.order": 1 } },
          { $limit: 1 },
        ]);

        getData.stop = getStop.length > 0 ? getStop[0].stops : {};

        return {
          status: true,
          message:
            getData.trip_status === "STARTED"
              ? "Trip started successfully."
              : "Trip status updated successfully.",
          data: await BookingAssign.transformStatus(getData),
        };
      }
    } else {
      return { status: false, message: "Assignment not found." };
    }
  } catch (err) {
    throw err;
  }
};

const updateLocation = async (driverId, lat, lng, address, angle) => {
  try {
    await enqueueDriverLocation({ driverId, lat, lng, address, angle }); // add in queues
    return true;
  } catch (err) {
    return "error while : " + err;
  }
};

module.exports = {
  updateLocation,
  getDriverById,
  verifyOTPExists,
  updateOne,
  getTrips,
  getBookings,
  updateBookingStatus,
  getNotifications,
  updateNotifications,
  assignTripStatus,
};
