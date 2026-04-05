const Joi = require('joi');
const User = require('../models/user.model');
const { role } = require('./custom.validation');


const listUsers = {
  query: Joi.object().keys({
    search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    limit: Joi.number().min(1).max(100),
    startDate: Joi.string(),
    endDate: Joi.string(),
    lastname: Joi.string(),
    sortBy: Joi.string(),
    sortDesc: Joi.string(),
    type: Joi.string(),
    status: Joi.boolean(),
    is_deleted: Joi.boolean(),
  }),
};

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    phone: Joi.string(),
    role: Joi.string().valid(role),
  }).unknown(),
};

const replaceUser = {
  params: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .required(),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required(),
      firstname: Joi.string(),
      lastname: Joi.string(),
      phone: Joi.string(),
      role: Joi.string().valid(role),
    })
    .unknown()
    .min(1),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .required(),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      firstname: Joi.string(),
      lastname: Joi.string(),
      phone: Joi.string(),
      role: Joi.string().valid(role),
    })
    .unknown()
    .min(1),
};

const updateStatus = {
  params: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.boolean(),
    })
};


module.exports = {
  // GET /v1/users
  listUsers,
  // POST /v1/users
  createUser,
  // PUT /v1/users/:userId
  replaceUser,
  // PATCH /v1/users/:userId
  updateUser,
updateStatus,
};
