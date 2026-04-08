const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const BusSchedule = require("../models/busSchedule.model");
const busScheduleLocation = require("../models/busScheduleLocation.model");

const isTxnNotSupported = (err) => {
  const message = String(err?.message || "");
  return message.includes(
    "Transaction numbers are only allowed on a replica set member or mongos",
  );
};

exports.search = async (req, res, next) => {
  try {
    const { search } = req.query;

    const condition = search
      ? {
          // $or: [
          route_name: { $regex: `(\s+${search}|^${search})`, $options: "i" },
          status: true,
        }
      : { status: true };
    const result = await BusSchedule.aggregate([
      {
        $lookup: {
          from: "routes",
          localField: "routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: "$route",
      },
      {
        $sort: { departure_time: 1 },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          status: 1,
          routeId: { $ifNull: ["$route._id", ""] },
          route_name: { $ifNull: [{ $concat: ["$route.title"] }, "-"] },
          departure_time: {
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
          arrival_time: {
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
        $match: condition,
      },
      {
        $sort: {
          route_name: -1,
        },
      },
    ]); //find(condition).lean();
    res.json({
      total_count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List bus schedule
 * @public
 */
exports.list = async (req, res) => {
  try {
    let condition = req.query.search
      ? {
          $or: [
            {
              title: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            // { max_seats: { $regex: new RegExp(req.query.search), $options: 'i' } },
            // {layout : { $regex: new RegExp(req.query.search), $options: 'i' } },
            // { last_seat: req.query.search != false},
          ],
        }
      : {};

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    if (req.query.routeId) {
      condition = { routeId: new mongoose.Types.ObjectId(req.query.routeId) };
    }

    // Filter by operator if user is an operator
    // if (req.user && req.user.role === "operator") {
    //   condition.operatorId = req.user._id;
    // }

    // Allow filtering by specific operatorId (admin only)
    // if (req.query.operatorId && req.user && req.user.role !== "operator") {
    //   condition.operatorId = new mongoose.Types.ObjectId(req.query.operatorId);
    // }

    const aggregateQuery = BusSchedule.aggregate([
      {
        $lookup: {
          from: "bus_schedule_locations",
          let: { busScheduleId: "$_id" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$busScheduleId", "$$busScheduleId"] } },
            },

            {
              $sort: { order: 1 },
            },
            {
              $project: {
                departure_time: 1,
                arrival_time: 1,
              },
            },
          ],
          as: "busScheduleStop",
        },
      },
      {
        $addFields: {
          depart_time: {
            $arrayElemAt: ["$busScheduleStop.departure_time", 0],
          },
          arrive_time: {
            $arrayElemAt: [
              "$busScheduleStop.arrival_time",
              { $subtract: [{ $size: "$busScheduleStop" }, 1] },
            ],
          },
        },
      },
      // {
      //   $lookup: {
      //     from: "admins",
      //     localField: "operatorId",
      //     foreignField: "_id",
      //     as: "operator",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$operator",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $lookup: {
          from: "routes",
          localField: "routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: "$route",
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          routeId: 1,
          bus_name: {
            $ifNull: [{ $concat: ["$bus.name", "(", "$bus.code", ")"] }, "-"],
          },
          route_name: { $ifNull: ["$route.title", "-"] },
          // operator_name: {
          //   $concat: [
          //     { $ifNull: ["$operator.firstname", ""] },
          //     " ",
          //     { $ifNull: ["$operator.lastname", ""] },
          //   ],
          // },
          //   operatorId: "$operatorId",
          start_date: 1,
          end_date: 1,
          status: 1,
          createdAt: 1,
          depart_time: { $ifNull: ["$depart_time", null] },
          arrive_time: { $ifNull: ["$arrive_time", null] },
        },
      },
      {
        $match: condition,
      },
    ]);

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
    };

    const result = await BusSchedule.aggregatePaginate(aggregateQuery, options);

    res.status(httpStatus.OK);
    res.json(result);
  } catch (error) {
    console.log(error);
    return error;
  }
};
/**
 * Get bus schedule
 * @public
 */
exports.get = async (req, res) => {
  try {
    const getBusSchedule = await BusSchedule.aggregate([
      {
        $lookup: {
          from: "bus_schedule_locations",
          let: { busScheduleId: "$_id" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$busScheduleId", "$$busScheduleId"] } },
            },
            {
              $lookup: {
                from: "locations",
                let: { stopId: "$stopId" },
                pipeline: [
                  {
                    $match: {
                      $and: [{ $expr: { $eq: ["$_id", "$$stopId"] } }],
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      title: 1,
                    },
                  },
                ],
                as: "location",
              },
            },
            {
              $unwind: "$location",
            },
            {
              $project: {
                location: 1,
                stopId: 1,
                stop_name: "$location.title",
                departure_time: 1,
                arrival_time: 1,
                order: 1,
              },
            },
            {
              $sort: { order: 1 },
            },
          ],
          as: "bus_schedule_location",
        },
      },
      {
        $lookup: {
          from: "routes",
          //   localField: "routeId",
          //   foreignField: "_id",
          let: { routeId: "$routeId" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$_id", "$$routeId"] } },
            },
            {
              $project: {
                _id: 0,
                id: "$_id",
                title: 1,
              },
            },
          ],
          as: "route",
        },
      },
      {
        $unwind: "$route",
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          stops: {
            $map: {
              input: "$bus_schedule_location",
              as: "schedule_location",
              in: {
                id: "$$schedule_location._id",
                stopId: "$$schedule_location.stopId",
                stop_name: "$$schedule_location.stop_name",
                order: "$$schedule_location.order",
                departure_time: "$$schedule_location.departure_time",
                arrival_time: "$$schedule_location.arrival_time",
              },
            },
          },
          every: 1,
          routeId: { $ifNull: ["$route.id", null] },
          route_name: { $ifNull: ["$route.title", null] },
          busId: 1,
          start_date: 1,
          end_date: 1,
          status: 1,
          createdAt: 1,
        },
      },
      {
        $match: { id: new mongoose.Types.ObjectId(req.params.busScheduleId) },
      },
    ]);

    res.status(httpStatus.OK);
    res.json(getBusSchedule[0]);
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create  bus schedule
 * @public
 */
exports.create = async (req, res) => {
  const { every, routeId, busId, start_date, end_date, stops, status } =
    req.body;

  const execute = async (session) => {
    const departureTime = stops.map((stop) => stop.departure_time);
    const arrivalTime = stops.map((stop) => stop.arrival_time);
    const departTime = departureTime[0];
    const arriveTime = arrivalTime[arrivalTime.length - 1];

    let busSchedule;
    if (session) {
      busSchedule = await BusSchedule.create(
        [
          {
            every,
            routeId,
            busId,
            operatorId: req.user._id,
            start_date,
            end_date,
            status,
            departure_time: departTime,
            arrival_time: arriveTime,
          },
        ],
        { session },
      );
    } else {
      const created = await BusSchedule.create({
        every,
        routeId,
        busId,
        operatorId: req.user._id,
        start_date,
        end_date,
        status,
        departure_time: departTime,
        arrival_time: arriveTime,
      });
      busSchedule = [created];
    }

    const scheduleId = busSchedule[0]._id;
    await busScheduleLocation.createOrUpdate(scheduleId, stops, session);
  };

  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => execute(session));
    } finally {
      session.endSession();
    }
    return res.status(httpStatus.CREATED).json({
      status: true,
      message: "bus schedule create successfully",
    });
  } catch (error) {
    if (!isTxnNotSupported(error)) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ status: false, message: error?.message || "Failed to create" });
    }
    try {
      await execute(null);
      return res.status(httpStatus.CREATED).json({
        status: true,
        message: "bus schedule create successfully",
      });
    } catch (fallbackError) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: fallbackError?.message || "Failed to create",
      });
    }
  }
};

/**
 * Update bus schedule
 * @public
 */
exports.update = async (req, res, next) => {
  const { every, routeId, busId, start_date, end_date, stops, status } =
    req.body;

  const execute = async (session) => {
    let busScheduleQuery = BusSchedule.findById(req.params.busScheduleId);
    if (session) busScheduleQuery = busScheduleQuery.session(session);
    const busSchedule = await busScheduleQuery;

    if (!busSchedule) {
      return { found: false };
    }

    const departureTime = stops.map((stop) => stop.departure_time);
    const arrivalTime = stops.map((stop) => stop.arrival_time);
    const departTime = departureTime[0];
    const arriveTime = arrivalTime[arrivalTime.length - 1];

    const updateObj = {
      every,
      routeId,
      busId,
      start_date,
      end_date,
      status,
      departure_time: departTime,
      arrival_time: arriveTime,
    };

    const updateOptions = { new: true };
    if (session) updateOptions.session = session;

    await BusSchedule.findByIdAndUpdate(
      req.params.busScheduleId,
      { $set: updateObj },
      updateOptions,
    );

    if (session) {
      await busScheduleLocation
        .deleteMany({ busScheduleId: req.params.busScheduleId })
        .session(session);
    } else {
      await busScheduleLocation.deleteMany({
        busScheduleId: req.params.busScheduleId,
      });
    }

    await busScheduleLocation.createOrUpdate(
      req.params.busScheduleId,
      stops,
      session,
    );

    return { found: true };
  };

  const respond = (result) => {
    if (!result?.found) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: false,
        message: "Bus schedule not found",
      });
    }
    return res.status(httpStatus.OK).json({
      status: true,
      message: "Bus schedule updated successfully",
    });
  };

  try {
    const session = await mongoose.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        result = await execute(session);
      });
    } finally {
      session.endSession();
    }
    return respond(result);
  } catch (error) {
    if (!isTxnNotSupported(error)) return next(error);
    try {
      const result = await execute(null);
      return respond(result);
    } catch (fallbackError) {
      return next(fallbackError);
    }
  }
};

/**
 * Update Status bus schedule
 * @param status
 * @public
 */
exports.status = async (req, res) => {
  try {
    const { status } = req.body;
    const update = await BusSchedule.findByIdAndUpdate(
      req.params.busScheduleId,
      { status: status },
    );
    if (update) {
      res.json({
        message: `status now is ${status}.`,
        status: true,
      });
    } else {
      res.json({
        message: `updated failed.`,
        status: false,
      });
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Delete bus schedule
 * @public
 */
exports.remove = async (req, res) => {
  BusSchedule.deleteOne({
    _id: req.params.busScheduleId,
  })
    .then(async () => {
      await busScheduleLocation.deleteMany({
        busScheduleId: req.params.busScheduleId,
      });
      res.status(httpStatus.OK).json({
        status: true,
        message: "Bus Schedule deleted successfully.",
      });
    })
    .catch((e) => next(e));
};
