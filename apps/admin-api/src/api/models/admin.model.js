const mongoose = require("mongoose");
const httpStatus = require("http-status");
const { omitBy, isNil } = require("lodash");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");
const jwt = require("jwt-simple");
const { v4: uuidv4 } = require("uuid");
const paginateAggregate = require("mongoose-aggregate-paginate-v2");
const APIError = require("../utils/APIError");
const {
  BASEURL,
  FULLBASEURL,
  port,
  env,
  jwtSecret,
  jwtExpirationInterval,
} = require("../../config/vars");
/**
 * Admin Details Schema (Sub-document)
 */
const detailsSchema = new mongoose.Schema(
  {
    address_1: { type: String, default: "" },
    address_2: { type: String, default: "" },
    city: { type: mongoose.Schema.Types.Mixed, default: "" }, // can be string or array
    pincode: { type: String, default: "" },
    contact_no: { type: String, default: "" },
    company: { type: String, default: "" },
    is_agent: { type: Boolean, default: false },
    commission: { type: Number, default: 0 },
    document_pan_card: { type: String, default: "" },
    document_gst_certificate: { type: String, default: "" },
    // Operator-specific fields
    is_operator: { type: Boolean, default: true },
    operator_business_name: { type: String, default: "" },
    operator_license_number: { type: String, default: "" },
    operator_commission: { type: Number, default: 0 },
    operator_status: {
      type: String,
      enum: ["pending", "active", "suspended", "rejected"],
      default: "pending",
    },
    operator_approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    operator_approved_at: { type: Date, default: null },
    operator_rejection_reason: { type: String, default: "" },
    operator_transport_license: {
      type: String,
      default: "public/documents/default.jpg",
    },
    operator_business_registration: {
      type: String,
      default: "public/documents/default.jpg",
    },
    operator_pan_card: {
      type: String,
      default: "public/documents/default.jpg",
    },
  },
  { _id: false },
);

/**
 * Admin Schema
 * @private
 */
const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 6,
      maxlength: 128,
    },
    firstname: {
      type: String,
      maxlength: 128,
      index: true,
      trim: true,
    },
    lastname: {
      type: String,
      maxlength: 128,
      index: true,
      trim: true,
    },
    country_code: { type: String, default: "91" },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    services: {
      facebook: String,
      google: String,
    },
    role: {
      type: String,
      default: "",
    },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    picture: {
      type: String,
      trim: true,
      default: "default.jpg",
    },
    is_active: { type: Boolean, default: false },
    last_login: { type: Date, default: new Date() },
    details: { type: detailsSchema, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
adminSchema.pre("save", async function save(next) {
  try {
    if (!this.isModified("password")) return next();

    const rounds = env === "test" ? 1 : 10;

    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;

    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
adminSchema.method({
  transform() {
    const transformed = {};

    const adminFields = [
      "id",
      "firstname",
      "lastname",
      "phone",
      "email",
      "picture",
      "country_code",
      "role",
      "roleId",
      "createdAt",
      "last_login",
      "details",
    ];

    adminFields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  token() {
    const payload = {
      exp: moment().add(jwtExpirationInterval, "minutes").unix(),
      iat: moment().unix(),
      sub: this._id,
      type: "Bearer",
      roleId: this.roleId,
    };
    return jwt.encode(payload, jwtSecret);
  },

  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  },
});

adminSchema.virtual("roles", {
  ref: "Role", // the model to use
  localField: "roleId", // find children where 'localField'
  foreignField: "_id", // is equal to foreignField
  justOne: true,
});

/**
 * Statics
 */
adminSchema.statics = {
  /**
   * Get admin
   *
   * @param {ObjectId} id - The objectId of admin.
   * @returns {Promise<Admin, APIError>}
   */
  async get(id) {
    try {
      let admin;

      if (mongoose.Types.ObjectId.isValid(id)) {
        admin = await this.findById(id)
          .populate(["admin_details", "roles"])
          .lean();
      }

      if (admin) {
        return admin;
      }

      throw new APIError({
        message: "Admin does not exist",
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find admin by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of admin.
   * @returns {Promise<Admin, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, password, refreshObject } = options;
    if (!email) {
      throw new APIError({
        message: "An email is required to generate a token",
      });
    }

    const admin = await this.findOne({ email }).exec();

    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (password) {
      if (admin && (await admin.passwordMatches(password))) {
        return { admin, accessToken: admin.token() };
      }
      err.message = "Incorrect password";
    } else if (refreshObject && refreshObject.userEmail === email) {
      if (moment(refreshObject.expires).isBefore()) {
        err.message = "Invalid refresh token.";
      } else {
        return { admin, accessToken: admin.token() };
      }
    } else {
      err.message = "Incorrect email or refreshToken";
    }
    throw new APIError(err);
  },

  /**
   * List admins in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of admins to be skipped.
   * @param {number} limit - Limit number of admins to be returned.
   * @returns {Promise<Admin[]>}
   */
  list({ page = 1, perPage = 30, firstname, lastname, email, role }) {
    const options = omitBy(
      {
        firstname,
        lastname,
        email,
        role,
      },
      isNil,
    );

    return this.find(options)
      .populate("adminId")
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },
  transformData(rows) {
    const selectableItems = [];
    let i = 1;

    console.log("rows", rows);
    rows.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item.id,
        firstname: item.firstname,
        lastname: item.lastname,
        email: item.email,
        phone: item.phone,
        role: item.role,
        picture: this.isValidURL(item.picture)
          ? item.picture
          : `${FULLBASEURL}${item.picture}`,
        last_login: moment.utc(item.last_login).format("LLL"),
        is_active: item.is_active == true ? "Active" : "Inactive",
        createdAt: moment.utc(item.createdAt).format("LL"),
        details: item.details || null,
      });
    });
    return selectableItems;
  },
  isValidURL(str) {
    const regex =
      /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(str)) {
      return false;
    }
    return true;
  },
  isValidBase64(str) {
    const regex =
      /^data:image\/(?:gif|png|jpeg|jpg|bmp|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}/g;

    if (regex.test(str)) {
      return true;
    }
    return false;
  },
  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateEmail(error) {
    if (error.name === "MongoError" && error.code === 11000) {
      return new APIError({
        message: "Validation Error",
        errors: [
          {
            field: "email",
            location: "body",
            messages: ['"email" already exists'],
          },
        ],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },

  async oAuthLogin({ service, id, email, name, picture }) {
    const admin = await this.findOne({
      $or: [{ [`services.${service}`]: id }, { email }],
    });
    if (admin) {
      admin.services[service] = id;
      if (!admin.name) admin.name = name;
      if (!admin.picture) admin.picture = picture;
      return admin.save();
    }
    const password = uuidv4();
    return this.create({
      services: { [service]: id },
      email,
      password,
      name,
      picture,
    });
  },
};

adminSchema.plugin(paginateAggregate);
/**
 * @typedef Admin
 */
module.exports = mongoose.model("Admin", adminSchema);
