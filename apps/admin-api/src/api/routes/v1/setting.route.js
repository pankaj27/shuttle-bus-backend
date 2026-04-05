const express = require("express");
const controller = require("../../controllers/setting.controller");

const { authorize, ADMIN, getAuth } = require("../../middlewares/auth");

const router = express.Router();

router.route("/publicData").get(controller.publicData);

router
  .route("/:type")
  .get(getAuth("manage.application.settings", "master.admin"), controller.get);

router
  .route("/:type")
  /**
   * update the single location
   * */
  .patch(
    getAuth("application.settings.edit", "master.admin"),
    controller.update,
  );

router
  .route("/:settingId/notifications")
  /**
   * update the single location
   * */
  .patch(getAuth("master.admin"), controller.updateNotificationSetting);

module.exports = router;
