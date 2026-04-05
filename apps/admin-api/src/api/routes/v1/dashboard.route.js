const express = require("express");
// const validate = require('express-validation');
const controller = require("../../controllers/dashboard.controller");
const { authorize, getAuth } = require("../../middlewares/auth");

const router = express.Router();

router
  .route("/get-records")
  // .get(getAuth('users'), controller.authLists)
  .get(getAuth("manage.dashboard"), controller.getTotalRecords);
router
  .route("/get-bookings")
  // .get(getAuth('users'), controller.authLists)
  .get(getAuth("manage.dashboard"), controller.getBookingData);

router
  .route("/stats")
  // .get(getAuth('users'), controller.authLists)
  .get(getAuth("manage.dashboard"), controller.getStats);

router
  .route("/revenue-analytics")
  .get(getAuth("manage.dashboard"), controller.getRevenueAnalytics);

router
  .route("/route-performance")
  .get(getAuth("manage.dashboard"), controller.getRoutePerformance);

module.exports = router;
