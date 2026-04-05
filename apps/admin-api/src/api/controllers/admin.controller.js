const httpStatus = require("http-status");
const mongoose = require("mongoose");
const Admin = require("../models/admin.model");
const Role = require("../models/role.model");
const AdminRole = require("../models/adminRole.model");
const slug = require("slug");
const { v4: uuidv4 } = require("uuid");
const Listeners = require("../events/Listener");
const APIError = require("../utils/APIError");
const emailProvider = require("../services/emails/emailProvider");
const { demoMode } = require("../../config/vars");
const { applyMasking } = require("../utils/masker");

exports.get = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.adminId);

    res.status(httpStatus.OK);
    res.json({
      message: "Admin fetched successfully.",
      data: demoMode
        ? applyMasking(admin.transform(), true)
        : admin.transform(),
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

exports.lists = async (req, res, next) => {
  try {
    let condition = req.query.search
      ? {
          $and: [
            {
              $or: [
                {
                  fullname: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  lastname: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  email: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  phone: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  role: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
              ],
            },
            { role: { $ne: "operator" } },
          ],
        }
      : { role: { $ne: "operator" } };

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    let newquery = {};
    if (req.query.createdAt) {
      const date = new Date(req.query.createdAt[0]);
      const nextDate = new Date(req.query.createdAt[1]);
      newquery.createdAt = {
        $gte: date,
        $lt: nextDate,
      };
    } else if (req.query.status) {
      newquery.is_active = req.query.status;
    } else if (typeof req.query.status === "boolean" && !req.query.status) {
      newquery.is_active = req.query.status;
    }

    condition = { ...condition, ...newquery };

    const aggregateQuery = Admin.aggregate([
      {
        $addFields: {
          id: {
            $toString: {
              $add: [{ $indexOfArray: [[], "$_id"] }, 1],
            },
          },
        },
      },
      {
        $addFields: {
          id: {
            $toString: {
              $add: [{ $indexOfArray: [[], "$_id"] }, 1],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          id: 1,
          picture: 1,
          firstname: 1,
          lastname: 1,
          fullname: { $concat: ["$firstname", " ", "$lastname"] },
          short_name: {
            $toUpper: {
              $concat: [
                { $substr: ["$firstname", 0, 1] },
                { $substr: ["$lastname", 0, 1] },
              ],
            },
          },
          email: 1,
          phone: 1,
          country_code: 1,
          role: 1,
          last_login: 1,
          is_active: 1,
          createdAt: 1,
        },
      },
      {
        $addFields: {
          sequence: { $add: [{ $indexOfArray: ["$_id", "$_id"] }, 1] },
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

    const result = await Admin.aggregatePaginate(aggregateQuery, options);

    if (demoMode) {
      result.items = applyMasking(result.items, true);
    }

    res.json(result);
  } catch (error) {
    console.log("error111", error);
    next(error);
  }
};

/**
 * Create new admin
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const {
      firstname,
      lastname,
      email,
      role,
      phone,
      password,
      contact_no,
      is_active,
      picture,
      country_code,
    } = req.body;

    const objadmin = {
      firstname,
      lastname,
      email,
      picture,
      country_code,
      phone,
      password,
      is_active,
      role,
    };

    const getRoleId = await Role.findOne({ slug: slug(role) }).lean();

    // Prepare details if they exist in body (or mapping from legacy structure)
    const objdetails = {
      contact_no: contact_no || "",
      address_1: req.body.address_1 || "",
      address_2: req.body.address_2 || "",
      city: req.body.city || "",
      pincode: req.body.pincode || "",
      is_agent: role === "operator",
      company: req.body.company || "",
      // simplified document handling for now matching previous code's intent
      document_gst_certificate:
        req.body.document_gst_certificate || "public/documents/default.jpg",
      document_pan_card:
        req.body.document_pan_card || "public/documents/default.jpg",
    };

    objadmin.details = objdetails;
    objadmin.roleId = getRoleId._id;

    const admin = new Admin(objadmin);
    const savedAdmin = await admin.save();

    const adminRole = new AdminRole({
      roleId: getRoleId._id,
      adminId: savedAdmin._id,
    });
    await adminRole.save();
    res.status(httpStatus.CREATED);
    // admin: savedAdmin.transform()
    res.json({
      message: `${role} created successfully.`,
      admin: savedAdmin.transform(),
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update new admin
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const adminId = req.params.adminId;

    const {
      firstname,
      lastname,
      email,
      role,
      phone,
      contact_no,
      is_active,
      country_code,
      // admin detail fields
      address_1,
      address_2,
      city,
      pincode,
      is_agent,
      company,
      commission,
      document_gst_certificate,
      document_pan_card,
      picture,
    } = req.body;

    // ✅ Find existing admin first
    const existingAdmin = await Admin.findById(adminId);
    if (!existingAdmin) {
      return res.status(httpStatus.NOT_FOUND).json({
        code: httpStatus.NOT_FOUND,
        msg: "Admin not found",
      });
    }

    // Build update object for Admin (only include provided fields)
    const adminUpdate = {};
    if (typeof firstname !== "undefined") adminUpdate.firstname = firstname;
    if (typeof lastname !== "undefined") adminUpdate.lastname = lastname;
    if (typeof email !== "undefined") adminUpdate.email = email;

    if (typeof phone !== "undefined") adminUpdate.phone = phone;
    if (typeof country_code !== "undefined")
      adminUpdate.country_code = country_code;
    if (typeof is_active !== "undefined") adminUpdate.is_active = is_active;
    if (typeof picture !== "undefined") adminUpdate.picture = picture;

    if (typeof role !== "undefined") {
      adminUpdate.role = role;
      const getRoleId = await Role.findOne({ slug: slug(role) }).lean();
      adminUpdate.roleId = getRoleId._id;
    }

    // Build admin detail update
    const detailsUpdate = existingAdmin.details || {};
    if (typeof contact_no !== "undefined")
      detailsUpdate.contact_no = contact_no;
    if (typeof address_1 !== "undefined") detailsUpdate.address_1 = address_1;
    if (typeof address_2 !== "undefined") detailsUpdate.address_2 = address_2;
    if (typeof city !== "undefined") detailsUpdate.city = city;
    if (typeof pincode !== "undefined") detailsUpdate.pincode = pincode;
    if (typeof is_agent !== "undefined") detailsUpdate.is_agent = is_agent;
    if (typeof company !== "undefined") detailsUpdate.company = company;
    if (typeof commission !== "undefined")
      detailsUpdate.commission = commission;
    if (typeof document_gst_certificate !== "undefined")
      detailsUpdate.document_gst_certificate = document_gst_certificate;
    if (typeof document_pan_card !== "undefined")
      detailsUpdate.document_pan_card = document_pan_card;

    adminUpdate.details = detailsUpdate;

    // Update Admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      new mongoose.Types.ObjectId(adminId),
      { $set: adminUpdate },
      { new: true },
    ).exec();

    res.status(httpStatus.OK);
    res.json({
      status: true,
      message: "Admin updated successfully.",
      admin: updatedAdmin.transform(),
    });
  } catch (error) {
    next(error);
  }
};
exports.remove = (req, res, next) => {
  Admin.deleteOne({ _id: req.params.adminId })
    .then(() =>
      res.status(httpStatus.OK).json({
        status: true,
        message: "Admin deleted successfully.",
      }),
    )
    .catch((e) => next(e));
};

exports.changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const adminId = req.params.adminId;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new APIError({
        message: "Admin not found",
        status: httpStatus.NOT_FOUND,
      });
    }
    admin.password = newPassword;
    await admin.save();
    res.status(httpStatus.OK).json({
      status: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const adminId = req.params.adminId;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new APIError({
        message: "Admin not found",
        status: httpStatus.NOT_FOUND,
      });
    }

    admin.last_login = new Date();
    await admin.save();

    res.status(httpStatus.OK).json({
      status: true,
      message: "Admin logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};
