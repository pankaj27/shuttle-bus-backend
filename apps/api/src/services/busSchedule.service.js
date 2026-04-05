const {
  User,
  Driver,
  BookingAssign,
  Booking,
  Location,
  Route,
  RouteStop,
  BusSchedule,
  BusScheduleLocation,
  DriverNotification,
} = require("../models");

const mongoose = require("mongoose");
const moment = require("moment-timezone");

/**
 * Find available bus schedules matching pickup and dropoff locations
 *
 * @param {Number} pickupLongitude - Longitude of pickup location (e.g., 85.3240)
 * @param {Number} pickupLatitude - Latitude of pickup location (e.g., 27.7172)
 * @param {String} pickupId - Optional: Specific pickup location ID (empty string if not provided)
 * @param {Number} dropoffLongitude - Longitude of dropoff location
 * @param {Number} dropoffLatitude - Latitude of dropoff location
 * @param {String} dropoffId - Optional: Specific dropoff location ID
 * @param {String} current_date - Booking date in format "YYYY-MM-DD" (e.g., "2026-02-01")
 * @param {String} current_time - Booking time in format "HH:MM" (e.g., "14:30")
 *
 * @returns {Array} Array of matching bus schedules with pickup and dropoff details
 *
 * NOTE: departure_time and arrival_time in BusScheduleLocation model are stored as Numbers
 * representing minutes from midnight (0-1439):
 * - 0 = 12:00 AM (midnight)
 * - 60 = 1:00 AM
 * - 720 = 12:00 PM (noon)
 * - 870 = 2:30 PM (14:30)
 * - 1439 = 11:59 PM
 */
const nearestData = async (
  pickupLongitude,
  pickupLatitude,
  pickupId,
  dropoffLongitude,
  dropoffLatitude,
  dropoffId,
  current_date,
  current_time,
) => {
  const tz = global.DEFAULT_TIMEZONE || "Asia/Kathmandu";
  const maxDistance = global.MAX_DISTANCE || 2000;
  const prebookingMinute = global.PREBOOKING_MINUTE || 30;

  // Day list for matching bus schedules
  const dayList = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  // Determine today's date in the app timezone for comparison
  const todayStr = moment.tz(tz).format("YYYY-MM-DD");

  // Step 1: Find pickup stop IDs (Calculated once as they are location-based)
  let pickupStopIds = [];
  let dropStopIds = [];

  if (pickupId != "") {
    const getpickupData = await Location.findOne({
      "location.coordinates": [pickupLongitude, pickupLatitude],
      type: "DA",
    }).lean();
    if (getpickupData) {
      pickupStopIds.push(getpickupData._id);
    } else {
      const getpickupStop = await Location.findById(pickupId).lean();
      if (getpickupStop) pickupStopIds.push(getpickupStop._id);
    }
  } else {
    const pickupStops = await Location.nearestStops(
      pickupLatitude,
      pickupLongitude,
      maxDistance,
    );
    pickupStopIds = pickupStops.map((stop) => stop._id);
  }

  // Step 2: Find dropoff stop IDs
  if (dropoffId != "") {
    const getdropoffStop = await Location.findById(dropoffId).lean();
    if (getdropoffStop) dropStopIds.push(getdropoffStop._id);
  } else {
    const dropStops = await Location.nearestStops(
      dropoffLatitude,
      dropoffLongitude,
      maxDistance,
    );
    dropStopIds = dropStops.map((stop) => stop._id);
  }

  // Step 3: Validate stop order
  const isOrderCorrect = await RouteStop.stopOrderValidate(
    pickupStopIds,
    dropStopIds,
  );

  if (!isOrderCorrect[0].result) {
    return { date: current_date, getnearestData: [] };
  }

  // Step 4: Search for next available booking (Loop up to 7 days)
  const now = moment.tz(tz);
  const currentMinutesNow = now.hour() * 60 + now.minute();
  let searchDate = current_date;
  let searchTime = current_time;

  for (let i = 0; i < 7; i++) {
    const bookingMoment = moment.tz(
      `${searchDate} ${searchTime}`,
      "YYYY-MM-DD HH:mm",
      tz,
    );
    let bookingMinutes = bookingMoment.hour() * 60 + bookingMoment.minute();
    const isToday = searchDate === todayStr;

    // If searching for today, we respect the provided search time window
    // This allows for timezone-independent searches and testing of future schedules
    // regardless of the server's current UTC/local time.

    const day = dayList[bookingMoment.day()];

    const nearestPickupDetails = await BusScheduleLocation.aggregate([
      {
        $addFields: {
          arrival_hour: {
            $floor: {
              $divide: [{ $ifNull: ["$arrival_time", "$departure_time"] }, 60],
            },
          },
          arrival_minute: {
            $mod: [{ $ifNull: ["$arrival_time", "$departure_time"] }, 60],
          },
        },
      },
      {
        $addFields: {
          timeDifference: {
            $subtract: [
              { $ifNull: ["$arrival_time", "$departure_time"] },
              bookingMinutes,
            ],
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $in: ["$stopId", pickupStopIds] },
              { $gte: ["$timeDifference", prebookingMinute] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "stopId",
          foreignField: "_id",
          as: "stop",
        },
      },
      { $unwind: "$stop" },
      {
        $lookup: {
          from: "bus_schedules",
          localField: "busScheduleId",
          foreignField: "_id",
          as: "busSchedule",
        },
      },
      { $unwind: "$busSchedule" },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["$busSchedule.status", true] },
              { $in: [day, "$busSchedule.every"] },
              { $lte: ["$busSchedule.start_date", new Date(searchDate)] },
              { $gte: ["$busSchedule.end_date", new Date(searchDate)] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "routes",
          localField: "busSchedule.routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      { $unwind: "$route" },
      {
        $lookup: {
          from: "buses",
          localField: "busSchedule.busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      { $unwind: "$bus" },
      {
        $lookup: {
          from: "bus_schedule_locations",
          localField: "busScheduleId",
          foreignField: "busScheduleId",
          as: "bus_schedule_locations",
        },
      },
      {
        $addFields: {
          total_of_stops: { $size: "$bus_schedule_locations" },
        },
      },
      {
        $project: {
          arrival_time: 1,
          departure_time: 1,
          pickup_arrival_time: "$arrival_time",
          pickup_departure_time: "$departure_time",
          total_of_stops: 1,
          bus_schedule_locations: 1,
          busScheduleId: "$busScheduleId",
          routeId: { $ifNull: ["$route._id", "-"] },
          route_name: { $ifNull: ["$route.title", "-"] },
          route_busId: { $ifNull: ["$busSchedule.busId", "-"] },
          route_bus_timetable: { $ifNull: ["$busSchedule.every", []] },
          bus_details: {
            code: { $ifNull: ["$bus.code", "-"] },
            name: { $ifNull: ["$bus.name", "-"] },
            reg_no: { $ifNull: ["$bus.reg_no", "-"] },
            brand: { $ifNull: ["$bus.brand", "-"] },
            model_no: { $ifNull: ["$bus.model_no", "-"] },
            chassis_no: { $ifNull: ["$bus.chassis_no", "-"] },
            amenities: { $ifNull: ["$bus.amenities", []] },
          },
          pickup_stop_id: "$stopId",
          pickup_stop_name: "$stop.title",
          pickup_stop_departure_time: {
            $cond: [
              { $eq: ["$departure_time", null] },
              "-",
              {
                $let: {
                  vars: {
                    h24: { $floor: { $divide: ["$departure_time", 60] } },
                    m: { $mod: ["$departure_time", 60] },
                  },
                  in: {
                    $concat: [
                      {
                        $let: {
                          vars: {
                            h12: {
                              $cond: [
                                { $eq: [{ $mod: ["$$h24", 12] }, 0] },
                                12,
                                { $mod: ["$$h24", 12] },
                              ],
                            },
                          },
                          in: {
                            $dateToString: {
                              date: {
                                $add: [
                                  new Date("1970-01-01T00:00:00Z"),
                                  { $multiply: ["$$h12", 3600000] },
                                ],
                              },
                              format: "%H",
                            },
                          },
                        },
                      },
                      ":",
                      {
                        $dateToString: {
                          date: {
                            $add: [
                              new Date("1970-01-01T00:00:00Z"),
                              { $multiply: ["$$m", 60000] },
                            ],
                          },
                          format: "%M",
                        },
                      },
                      {
                        $cond: [
                          { $lt: ["$departure_time", 720] },
                          " am",
                          " pm",
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
          pickup_stop_arrival_time: {
            $cond: [
              { $eq: ["$arrival_time", null] },
              "-",
              {
                $let: {
                  vars: {
                    h24: { $floor: { $divide: ["$arrival_time", 60] } },
                    m: { $mod: ["$arrival_time", 60] },
                  },
                  in: {
                    $concat: [
                      {
                        $let: {
                          vars: {
                            h12: {
                              $cond: [
                                { $eq: [{ $mod: ["$$h24", 12] }, 0] },
                                12,
                                { $mod: ["$$h24", 12] },
                              ],
                            },
                          },
                          in: {
                            $dateToString: {
                              date: {
                                $add: [
                                  new Date("1970-01-01T00:00:00Z"),
                                  { $multiply: ["$$h12", 3600000] },
                                ],
                              },
                              format: "%H",
                            },
                          },
                        },
                      },
                      ":",
                      {
                        $dateToString: {
                          date: {
                            $add: [
                              new Date("1970-01-01T00:00:00Z"),
                              { $multiply: ["$$m", 60000] },
                            ],
                          },
                          format: "%M",
                        },
                      },
                      {
                        $cond: [{ $lt: ["$arrival_time", 720] }, " am", " pm"],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $sort: { departure_time: 1, arrival_time: 1 },
      },
    ]);

    const nearestDropoffDetails = await BusScheduleLocation.aggregate([
      {
        $match: {
          $expr: {
            $and: [{ $in: ["$stopId", dropStopIds] }],
          },
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "stopId",
          foreignField: "_id",
          as: "stop",
        },
      },
      { $unwind: "$stop" },
      {
        $lookup: {
          from: "bus_schedules",
          localField: "busScheduleId",
          foreignField: "_id",
          as: "busSchedule",
        },
      },
      { $unwind: "$busSchedule" },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["$busSchedule.status", true] },
              { $in: [day, "$busSchedule.every"] },
              { $lte: ["$busSchedule.start_date", new Date(searchDate)] },
              { $gte: ["$busSchedule.end_date", new Date(searchDate)] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "routes",
          localField: "busSchedule.routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      { $unwind: "$route" },
      {
        $project: {
          _id: 0,
          arrival_time: 1,
          departure_time: 1,
          drop_arrival_time: "$arrival_time",
          drop_departure_time: "$departure_time",
          routeId: { $ifNull: ["$route._id", "-"] },
          route_name: { $ifNull: ["$route.title", "-"] },
          route_busId: { $ifNull: ["$busSchedule.busId", "-"] },
          busScheduleId: "$busScheduleId",
          drop_stop_name: "$stop.title",
          drop_stop_id: "$stopId",
          drop_stop_departure_time: {
            $cond: [
              { $eq: ["$departure_time", null] },
              "-",
              {
                $let: {
                  vars: {
                    h24: { $floor: { $divide: ["$departure_time", 60] } },
                    m: { $mod: ["$departure_time", 60] },
                  },
                  in: {
                    $concat: [
                      {
                        $let: {
                          vars: {
                            h12: {
                              $cond: [
                                { $eq: [{ $mod: ["$$h24", 12] }, 0] },
                                12,
                                { $mod: ["$$h24", 12] },
                              ],
                            },
                          },
                          in: {
                            $dateToString: {
                              date: {
                                $add: [
                                  new Date("1970-01-01T00:00:00Z"),
                                  { $multiply: ["$$h12", 3600000] },
                                ],
                              },
                              format: "%H",
                            },
                          },
                        },
                      },
                      ":",
                      {
                        $dateToString: {
                          date: {
                            $add: [
                              new Date("1970-01-01T00:00:00Z"),
                              { $multiply: ["$$m", 60000] },
                            ],
                          },
                          format: "%M",
                        },
                      },
                      {
                        $cond: [
                          { $lt: ["$departure_time", 720] },
                          " am",
                          " pm",
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
          drop_stop_arrival_time: {
            $cond: [
              { $eq: ["$arrival_time", null] },
              "-",
              {
                $let: {
                  vars: {
                    h24: { $floor: { $divide: ["$arrival_time", 60] } },
                    m: { $mod: ["$arrival_time", 60] },
                  },
                  in: {
                    $concat: [
                      {
                        $let: {
                          vars: {
                            h12: {
                              $cond: [
                                { $eq: [{ $mod: ["$$h24", 12] }, 0] },
                                12,
                                { $mod: ["$$h24", 12] },
                              ],
                            },
                          },
                          in: {
                            $dateToString: {
                              date: {
                                $add: [
                                  new Date("1970-01-01T00:00:00Z"),
                                  { $multiply: ["$$h12", 3600000] },
                                ],
                              },
                              format: "%H",
                            },
                          },
                        },
                      },
                      ":",
                      {
                        $dateToString: {
                          date: {
                            $add: [
                              new Date("1970-01-01T00:00:00Z"),
                              { $multiply: ["$$m", 60000] },
                            ],
                          },
                          format: "%M",
                        },
                      },
                      {
                        $cond: [{ $lt: ["$arrival_time", 720] }, " am", " pm"],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $sort: { departure_time: 1, arrival_time: 1 },
      },
    ]);

    let mergeroutes = [];
    nearestPickupDetails.map((pickupItem) => {
      const matchingDropItem = nearestDropoffDetails.find(
        (dropItem) =>
          dropItem.busScheduleId.toString() ===
          pickupItem.busScheduleId.toString(),
      );
      if (matchingDropItem) {
        // Validation: Verify if the bus reaches the pickup point BEFORE the drop-off point
        const pickupTime = pickupItem.arrival_time || pickupItem.departure_time;
        const dropoffTime =
          matchingDropItem.arrival_time || matchingDropItem.departure_time;

        if (pickupTime && dropoffTime && pickupTime < dropoffTime) {
          const {
            arrival_time,
            departure_time,
            bus_schedule_locations,
            ...pickupRest
          } = pickupItem;
          const {
            arrival_time: drop_arrival,
            departure_time: drop_departure,
            ...dropRest
          } = matchingDropItem;

          // Calculate stops strictly between pickup and dropoff
          const intermediateStops =
            pickupItem.bus_schedule_locations?.filter((loc) => {
              const locTime = loc.arrival_time || loc.departure_time;
              return locTime > pickupTime && locTime < dropoffTime;
            }) || [];

          mergeroutes.push({
            ...pickupRest,
            ...dropRest,
            total_of_stops: intermediateStops.length,
            arrival_time: pickupItem.arrival_time,
            departure_time: pickupItem.departure_time,
          });
        }
      }
    });

    if (mergeroutes.length > 0) {
      return {
        date: searchDate,
        getnearestData: mergeroutes.filter((m) => m !== null),
      };
    }

    // If no data found for current search date, increment to next day
    searchDate = moment
      .tz(searchDate, "YYYY-MM-DD", tz)
      .add(1, "days")
      .format("YYYY-MM-DD");
    searchTime = "00:00"; // For future days, show all available buses starting from midnight
  }

  return { date: searchDate, getnearestData: [] };
};

module.exports = {
  nearestData,
};
