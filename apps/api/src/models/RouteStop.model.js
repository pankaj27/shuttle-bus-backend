const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = Schema;

// const stopSchema = new Schema();
const objectIdToTimestamp = require("objectid-to-timestamp");

const RouteStopSchema = new Schema(
  {
    routeId: { type: ObjectId, ref: "Route", required: true },
    stopId: { type: ObjectId, ref: "Location", required: true },
    order: { type: Number, default: 1 },
    minimum_fare_pickup: { type: Number, default: 0, index: true },
    minimum_fare_drop: { type: Number, default: 0, index: true },
    price_per_km_drop: { type: Number, default: 0, index: true },
    price_per_km_pickup: { type: Number, default: 0, index: true },
    distance: { type: Number, default: 0 },
  },
  { timestamps: true },
);

RouteStopSchema.statics = {
  async stopOrderValidate(pickupId, dropId) {
    const pickupIds = Array.isArray(pickupId) ? pickupId : [pickupId].filter(Boolean);
    const dropIds = Array.isArray(dropId) ? dropId : [dropId].filter(Boolean);
    const stopIds = [...pickupIds, ...dropIds].filter(Boolean);

    if (stopIds.length === 0) return [{ result: false }];

    return this.aggregate([
      {
        $match: {
          stopId: { $in: stopIds },
        },
      },
      {
        $group: {
          _id: "$routeId",
          pickupCount: {
            $sum: { $cond: [{ $in: ["$stopId", pickupIds] }, 1, 0] },
          },
          dropCount: {
            $sum: { $cond: [{ $in: ["$stopId", dropIds] }, 1, 0] },
          },
          minPickupOrder: {
            $min: {
              $cond: [{ $in: ["$stopId", pickupIds] }, "$order", null],
            },
          },
          maxDropOrder: {
            $max: { $cond: [{ $in: ["$stopId", dropIds] }, "$order", null] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          result: {
            $and: [
              { $gt: ["$pickupCount", 0] },
              { $gt: ["$dropCount", 0] },
              { $lt: ["$minPickupOrder", "$maxDropOrder"] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          anyResultTrue: {
            $max: "$result",
          },
        },
      },
      {
        $project: {
          _id: 0,
          result: "$anyResultTrue",
        },
      },
    ]);
  },
  validateAndConvert(inputString) {
    if (Array.isArray(inputString)) {
      return inputString.map((item) => String(item).trim());
    }
    if (inputString === undefined || inputString === null) {
      return [];
    }
    inputString = String(inputString);
    // Remove any leading or trailing spaces
    inputString = inputString.trim();

    // Check if the inputString contains a comma
    if (inputString.includes(",")) {
      // Split the string into an array using comma as the separator
      return inputString.split(",").map((item) => item.trim());
    } else {
      // If there's no comma, convert the single item to an array
      return [inputString];
    }
  },
  formatstops(data, pickupId, dropId) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        id: item.id,
        name: item.location.title,
        pickup: objectIdToTimestamp(item.id) == pickupId ? true : false,
        drop: objectIdToTimestamp(item.id) == dropId ? true : false,
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0],
      });
    });
    return selectableItems;
  },
};

module.exports = mongoose.model("Route_Stop", RouteStopSchema);
