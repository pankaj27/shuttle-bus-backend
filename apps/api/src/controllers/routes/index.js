const Utils = require("../../utils/utils");
const routeUtils = require("../../utils/route.utils");
const {
  SearchAddress,
  Setting,
  Location,
  Route,
  RouteStop,
  RouteDetail,
  BusSchedule,
} = require("../../models");
const { busSchedule } = require("../../services");
const _ = require("lodash");
const objectIdToTimestamp = require("objectid-to-timestamp");
const moment = require("moment-timezone");
const mongoose = require("mongoose");

module.exports = {
  searchNearestStops: async (req, res) => {
    try {
      const { lat, lng } = req.body;

      const getData = await Location.nearestRouteStops(lat, lng, MAX_DISTANCE);
      res.status(200).json({
        status: true,
        message: "Successfully stops founds",
        data: getData,
      });
    } catch (err) {
      res.status(200).json({
        status: false,
        message: "nearest stops not found",
        errorMessage: err.message,
      });
    }
  },
  searchroute: async (req, res) => {
    try {
      var {
        pickup_lat,
        pickup_long,
        pickup_id,
        drop_lat,
        drop_long,
        drop_id,
        search_type,
        current_date,
        end_date,
        current_time,
        type,
      } = req.body;

      //console.log("req.body",req.body);

      const getData = await busSchedule.nearestData(
        parseFloat(pickup_long),
        parseFloat(pickup_lat),
        pickup_id,
        parseFloat(drop_long),
        parseFloat(drop_lat),
        drop_id,
        current_date,
        current_time
      );
	  
      if (getData.getnearestData.length > 0) {
        res.status(200).json({
          status: true,
          message: "Successfully found route",
          data:getData,
        });
      } else {
        res.status(200).json({
          status: false,
          message: "No route found.",
        });
      }
    } catch (err) {
      res.status(200).json({
        status: false,
        message: "No route found",
        errorMessage: err.message,
      });
    }
  },
  fetchroutes: async (req, res) => {
    try {
      const { pickup_stop_id, drop_stop_id } = req.body;
      const getdata = await Route.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(req.params.routeId) },
        },
        {
          $lookup: {
            from: "route_stops",
            let: { routeId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$routeId", "$$routeId"] } } },
              {
                $lookup: {
                  from: "locations",
                  let: { stopId: "$stopId" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$stopId"] } } },
                    {
                      $project: {
                        _id: 0,
                        id: "$_id",
                        address: 1,
                        title: 1,
                        coordinates: "$location.coordinates",
                        pickup: {
                          $cond: {
                            if: { $eq: ["$_id", new mongoose.Types.ObjectId(pickup_stop_id)] },
                            then: true,
                            else: false,
                          },
                        },
                        drop: {
                          $cond: {
                            if: { $eq: ["$_id", new mongoose.Types.ObjectId(drop_stop_id)] },
                            then: true,
                            else: false,
                          },
                        },
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
                  _id: 0,
                  id: { $ifNull: ["$location.id", ""] },
                  name: { $ifNull: ["$location.title", ""] },
                  pickup:{ $ifNull: ["$location.pickup", false] },
                  drop:{ $ifNull: ["$location.drop", false] },
                  lat: {
                    $ifNull: [
                      { $arrayElemAt: ["$location.coordinates", 1] },
                      0,
                    ],
                  },
                  lng: {
                    $ifNull: [
                      { $arrayElemAt: ["$location.coordinates", 0] },
                      0,
                    ],
                  },
                },
              },
            ],
            as: "route_stop",
          },
        },
        {
          $unwind: "$route_stop",
        },
        {
          $project: {
            _id: 0,
            id: "$route_stop.id",
            name: "$route_stop.name",
            pickup: "$route_stop.pickup",
            drop: "$route_stop.drop",
            lat: "$route_stop.lat",
            lng: "$route_stop.lng",
          },
        },
      ]);

      res.status(200).json({
        status: true,
        message: "Successfully found route",
        data: getdata,
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "Location not found 23",
        errorMessage: err.message,
      });
    }
  },
  fetchroutetiming: async (req, res) => {
    try {
      const { route_id, pickup_stop_id, drop_stop_id } = req.body;

      res.status(200).json({
        status: true,
        message: "Successfully found route",
        data: {
          route_id,
          pickup_stop_id,
          drop_stop_id,
        },
      });
    } catch (err) {

      res.status(404).json({
        status: false,
        message: "stops not found",
        errorMessage: err.message,
      });
    }
  },
  seatprice: async (req, res) => {
    try {
      const { routeId, pickup_stop_id, drop_stop_id, seat_no, busId } =
        req.body;

      const getdata = await RouteStop.findOne({ routeId: routeId }).select({
        stops: { $elemMatch: { id: { $in: [pickup_stop_id, drop_stop_id] } } },
      });

      res.status(200).json({
        status: true,
        message: "Successfully found route",
        data: getdata,
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "stops not found",
        errorMessage: err.message,
      });
    }
  },
  explore: async (req, res) => {
	     try {
      const getdata = await Route.aggregate([
	       {
          $match: { status: true },
        },
        {
          $lookup: {
            from: "route_stops",
            let: { routeId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$routeId", "$$routeId"] } } },
              {
                $lookup: {
                  from: "locations",
                  let: { stopId: "$stopId" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$stopId"] } } },
                    {
                      $project: {
                        _id: 0,
                        id: "$_id",
                        address: 1,
                        title: 1,
                        coordinates: "$location.coordinates",
                        type: 1,
                        files: 1,
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
                $lookup: {
                  from: "bus_schedule_locations",
                  let: { stopId: "$stopId", routeId: "$routeId" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$stopId", "$$stopId"] } } },
                    {
                      $lookup: {
                        from: "bus_schedules",
                        let: { bsId: "$busScheduleId" },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $and: [
                                  { $eq: ["$_id", "$$bsId"] },
                                  { $eq: ["$routeId", "$$routeId"] },
                                ],
                              },
                            },
                          },
                        ],
                        as: "schedule",
                      },
                    },
                    { $match: { schedule: { $ne: [] } } },
                    { $sort: { departure_time: 1 } },
                    {
                      $project: { _id: 0, departure_time: 1, arrival_time: 1 },
                    },
                  ],
                  as: "bus_timings",
                },
              },
              {
                $project: {
                  routeId: 1,
                  stopId: 1,
                  order: 1,
                  location: 1,
                  minimum_fare_pickup: 1,
                  minimum_fare_drop: 1,
                  price_per_km_drop: 1,
                  price_per_km_pickup: 1,
                  bus_timings: 1,
                },
              },
            ],
            as: "route_stop",
          },
        },
        {
          $project: {
            _id: 0,
            routeId: { $ifNull: ["$_id", null] },
            route_title: { $ifNull: ["$title", ""] },
            stops: {
              $map: {
                input: "$route_stop",
                as: "data",
                in: {
                  stopId: "$$data.id",
                  name: "$$data.location.title",
                  files: { $ifNull: ["$$data.location.files", ""] },
                  timings: {
                    $map: {
                      input: { $ifNull: ["$$data.bus_timings", []] },
                      as: "bt",
                      in: {
                        departure_time: {
                          $cond: [
                            { $eq: ["$$bt.departure_time", null] },
                            "-",
                            {
                              $let: {
                                vars: {
                                  h24: {
                                    $floor: {
                                      $divide: ["$$bt.departure_time", 60],
                                    },
                                  },
                                  m: { $mod: ["$$bt.departure_time", 60] },
                                },
                                in: {
                                  $concat: [
                                    {
                                      $let: {
                                        vars: {
                                          h12: {
                                            $cond: [
                                              {
                                                $eq: [
                                                  { $mod: ["$$h24", 12] },
                                                  0,
                                                ],
                                              },
                                              12,
                                              { $mod: ["$$h24", 12] },
                                            ],
                                          },
                                        },
                                        in: {
                                          $dateToString: {
                                            date: {
                                              $add: [
                                                new Date(
                                                  "1970-01-01T00:00:00Z",
                                                ),
                                                {
                                                  $multiply: ["$$h12", 3600000],
                                                },
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
                                        { $lt: ["$$bt.departure_time", 720] },
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
                            { $eq: ["$$bt.arrival_time", null] },
                            "-",
                            {
                              $let: {
                                vars: {
                                  h24: {
                                    $floor: {
                                      $divide: ["$$bt.arrival_time", 60],
                                    },
                                  },
                                  m: { $mod: ["$$bt.arrival_time", 60] },
                                },
                                in: {
                                  $concat: [
                                    {
                                      $let: {
                                        vars: {
                                          h12: {
                                            $cond: [
                                              {
                                                $eq: [
                                                  { $mod: ["$$h24", 12] },
                                                  0,
                                                ],
                                              },
                                              12,
                                              { $mod: ["$$h24", 12] },
                                            ],
                                          },
                                        },
                                        in: {
                                          $dateToString: {
                                            date: {
                                              $add: [
                                                new Date(
                                                  "1970-01-01T00:00:00Z",
                                                ),
                                                {
                                                  $multiply: ["$$h12", 3600000],
                                                },
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
                                        { $lt: ["$$bt.arrival_time", 720] },
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
                      },
                    },
                  },
                  lat: {
                    $ifNull: [
                      { $arrayElemAt: ["$$data.location.coordinates", 1] },
                      0.0,
                    ],
                  },
                  lng: {
                    $ifNull: [
                      { $arrayElemAt: ["$$data.location.coordinates", 0] },
                      0.0,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $sort: { route_title: -1 },
        },
      ]);

      //  getdata.stops = await Route.filterStops(getdata.routedestops.stops)
      res.status(200).json({
        status: true,
        message: "Successfully found route",
        data: getdata, // await RouteStop.transformData(getdata)
      });
    } catch (err) {
      res.status(404).json({
        status: false,
        message: "stops not found",
        errorMessage: err.message,
      });
    }
  },
};
