const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const mongoose = require("mongoose");
const Role = require("../models/role.model");
const Resource = require("../models/resource.model");
const Permission = require("../models/permission.model");
const APIError = require("../utils/APIError");

// /**
//  * Load user and append to req.
//  * @public
//  */
// exports.addRolePermission = async (req, res, next) => {
//   try {
//     const rolePermission = new RolePermission({
//       roleId: req.perms.roleId,
//       permissionId: req.body.permission,
//     });
//     const savedRolePermission = await rolePermission.save();
//     res.status(httpStatus.CREATED);
//     res.json({ message: 'Role Permission added successfully.', status: true });
//   } catch (error) {
//     return next(error);
//   }
// };

// exports.removeRolePermission = async (req, res, next) => {
//   try {
//     const rolePermissionExists = await RolePermission.exists({
//       roleId: req.perms.roleId,
//       permissionId: req.body.permission,
//     });
//     if (rolePermissionExists) {
//       await RolePermission.deleteOne({
//         roleId: req.perms.roleId,
//         permissionId: req.body.permission,
//       });
//       res.status(httpStatus.CREATED);
//       res.json({
//         message: 'Role Permission added successfully.',
//         status: true,
//       });
//     }
//   } catch (error) {
//     return next(error);
//   }
// };

exports.attach = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const { name, permissions } = req.body;
    const permissionLists = Array.isArray(permissions)
      ? permissions.map((v) => v.code)
      : [];
    const updaterole = await Role.findByIdAndUpdate(
      roleId,
      {
        $set: {
          name,
          permissions: permissionLists,
        },
      },
      {
        new: true,
      },
    );
    if (!updaterole) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: false,
        message: "Role not found.",
      });
    }
    const transformedRole = updaterole.transform();

    res.json({
      message: "attach role to Permission successfully.",
      data: transformedRole,
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next) => {
  try {
    const role = await Role.find({ slug: { $ne: "agents" } }).sort({ name: 1 });
    res.status(httpStatus.OK);
    res.json({
      message: "Role Type load data.",
      data: Role.transformOptions(role),
      status: true,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get role
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.roleId);
    res.status(httpStatus.OK);
    res.json(await Role.transformSingleData(role));
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

/**
 * Get bsu layout list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const condition = req.query.search
      ? {
          $or: [
            {
              name: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
          ],
          slug: { $ne: "agents" },
        }
      : {
          slug: { $ne: "agents" },
        };

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }
    //    console.log('1212', sort);
    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
      populate: [{ path: "permissions", select: "name" }],
      lean: true,
    };

    const result = await Role.paginate(condition, paginationoptions);
    result.items = Role.transformData(result.items);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new role
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { name, slug, status, permissions } = req.body;

    const getPermissionIds = await Permission.find({
      slug: { $in: permissions },
    });
    const role = new Role({
      name,
      slug,
      status,
      permissions: getPermissionIds.map((v) => v._id),
    });
    const savedRole = await role.save();
    res.status(httpStatus.CREATED);
    res.json({ message: "Role created successfully.", status: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing bus type
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const { name, slug, status, permissions } = req.body;

    const getPermissionIds = await Permission.find({
      slug: { $in: permissions },
    });
    const updaterole = await Role.findByIdAndUpdate(
      req.params.roleId,
      {
        $set: {
          name,
          slug,
          status,
          permissions: getPermissionIds.map((v) => v._id),
        },
      },
      {
        new: true,
      },
    );
    const transformedRole = updaterole.transform();
    res.json({
      message: "Role updated successfully.",
      data: transformedRole,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bus type
 * @public
 */
exports.remove = (req, res, next) => {
  Role.deleteOne({
    _id: req.params.roleId,
  })
    .then(() =>
      res.status(httpStatus.OK).json({
        status: true,
        message: "Role deleted successfully.",
      }),
    )
    .catch((e) => next(e));
};
