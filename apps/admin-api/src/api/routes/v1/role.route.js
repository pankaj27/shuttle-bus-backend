const express = require("express");
const Validate = require("../../middlewares/validator");
const controller = require("../../controllers/role.controller");
const { getAuth } = require("../../middlewares/auth");
const { roleValidation } = require("../../validations");

const router = express.Router();

router
  .route("/")
  .post(
    getAuth("roles", "master.admin"),
    Validate(roleValidation.createRoles),
    controller.create,
  )
  .get(
    getAuth("roles", "master.admin"),
    Validate(roleValidation.listRoles),
    controller.list,
  );

router.route("/list").get(getAuth("master.admin"), controller.load);

// router
//   .route('/:roleId/permission')
//   .post(controller.addRolePermission)
//   .delete(controller.removeRolePermission);

router.route("/attach/:roleId/permissions").patch(controller.attach);

router
  .route("/:roleId")
  .get(getAuth("master.admin"), controller.get)

  /**
   * update the single location
   * */
  .patch(
    getAuth("roles", "master.admin"),
    Validate(roleValidation.updateRoles),
    controller.update,
  )
  /**
   * delete  the single location
   * */

  .delete(
    getAuth("roles", "master.admin"),
    Validate(roleValidation.deleteRoles),
    controller.remove,
  );

module.exports = router;
