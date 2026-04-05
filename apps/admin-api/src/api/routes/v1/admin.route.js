const express = require("express");
const Validate = require("../../middlewares/validator");
const controller = require("../../controllers/admin.controller");
const { getAuth } = require("../../middlewares/auth");
const { AdminValidation } = require("../../validations");
const router = express.Router();

router
  .route("/")
  .get(
    getAuth("master.admin"),
    Validate(AdminValidation.listAdmin),
    controller.lists,
  )
  .post(getAuth("master.admin"), controller.create);

router
  .route("/:adminId")
  .get(getAuth("master.admin"), controller.get)
  .patch(getAuth("master.admin"), controller.update)
  /**
   * delete the single admin
   * */
  .delete(getAuth("master.admin"), controller.remove);

router
  .route("/:adminId/change-password")
  .post(getAuth("master.admin"), controller.changePassword);

router
  .route("/:adminId/logout")

  .get(getAuth("master.admin"), controller.logout);

module.exports = router;
