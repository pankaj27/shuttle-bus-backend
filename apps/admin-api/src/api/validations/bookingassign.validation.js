const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createBookingAssign = {
  body: Joi.object()
    .keys({
      busScheduleId: Joi.string().custom(objectId).required(),
      driverId: Joi.string().custom(objectId).required(),
      routeId: Joi.string().custom(objectId).required(),
      assistantId: Joi.string().custom(objectId).allow(null, ""),
      dates: Joi.array().items(Joi.string()).required(),
    })
    .unknown(),
};

const listBookingAssign = {
  query: Joi.object()
    .keys({
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
      search: Joi.string().allow(null, ""),
      type: Joi.string().allow(null, ""),
      sortBy: Joi.string(),
      sortDesc: Joi.string(),
      status: Joi.string().allow(null, ""),
    })
    .unknown(),
};

const getBookingAssign = {
  params: Joi.object().keys({
    assignId: Joi.string().custom(objectId).required(),
  }),
};

const updateBookingAssign = {
  params: Joi.object().keys({
    assignId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      busScheduleId: Joi.string().custom(objectId),
      driverId: Joi.string().custom(objectId),
      routeId: Joi.string().custom(objectId),
      assistantId: Joi.string().custom(objectId).allow(null, ""),
      dates: Joi.array().items(Joi.string()),
      trip_status: Joi.string().valid(
        "ASSIGNED",
        "EXPIRED",
        "STARTED",
        "COMPLETED",
        "NOTSTARTED",
        "RIDING",
      ),
    })
    .unknown(),
};

const deleteBookingAssign = {
  params: Joi.object().keys({
    assignId: Joi.string().custom(objectId).required(),
  }),
};

const checkAvailability = {
  body: Joi.object().keys({
    driverId: Joi.string().custom(objectId).required(),
    busScheduleId: Joi.string().custom(objectId).required(),
    dates: Joi.array().items(Joi.string()).required(),
    excludeId: Joi.string().custom(objectId).allow(null, ""),
  }),
};

module.exports = {
  createBookingAssign,
  listBookingAssign,
  getBookingAssign,
  updateBookingAssign,
  deleteBookingAssign,
  checkAvailability,
};
