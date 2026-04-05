const Joi = require("joi");
const { objectId } = require("./custom.validation");

const listPass = {
  query: Joi.object()
    .keys({
      search: Joi.string().allow(null, ""),
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
      type: Joi.string().valid("all", "active", "inactive"),
      sortBy: Joi.string(),
      sortDesc: Joi.string(),
      status: Joi.boolean(),
    })
    .unknown(),
};

const createPass = {
  body: Joi.object().keys({
    no_of_rides: Joi.number(),
    no_of_valid_days: Joi.number(),
    price_per_km: Joi.number(),
    discount: Joi.number(),
    status: Joi.boolean(),
    description: Joi.string(),
    terms: Joi.string(),
  }),
};

const getPass = {
  params: Joi.object().keys({
    passId: Joi.string().custom(objectId),
  }),
};
const deletePass = {
  params: Joi.object().keys({
    passId: Joi.string().custom(objectId),
  }),
};

const updatePass = {
  params: Joi.object().keys({
    passId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      no_of_rides: Joi.number(),
      no_of_valid_days: Joi.number(),
      price_per_km: Joi.number(),
      discount: Joi.number(),
      status: Joi.boolean(),
      description: Joi.string(),
      terms: Joi.string(),
    })
    .unknown()
    .min(1),
};

module.exports = {
  // GET /v1/route
  listPass,
  getPass,
  // POST /v1/route
  createPass,
  // PATCH /v1/route/:routeId
  updatePass,
  deletePass,
};
