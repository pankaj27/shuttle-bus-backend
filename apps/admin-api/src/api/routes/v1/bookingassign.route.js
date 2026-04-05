const express = require("express");
const Validate = require("../../middlewares/validator");
const controller = require("../../controllers/bookingassign.controller");
const { authorize, getAuth } = require("../../middlewares/auth");
const {
  createBookingAssign,
  listBookingAssign,
  getBookingAssign,
  updateBookingAssign,
  deleteBookingAssign,
  checkAvailability,
} = require("../../validations/bookingassign.validation");

const router = express.Router();

router
  .route("/check-availability")
  .post(
    Validate(checkAvailability),
    getAuth("booking.assigns.create", "master.admin"),
    controller.checkAvailability,
  );

router
  .route("/")
  .post(
    Validate(createBookingAssign),
    getAuth("booking.assigns.create", "master.admin"),
    controller.create,
  );

router
  .route("/search")
  .get(
    Validate(listBookingAssign),
    getAuth("booking.assigns.view", "master.admin"),
    controller.list,
  );

router
  .route("/:assignId")
  .get(
    Validate(getBookingAssign),
    getAuth("booking.assigns.edit", "master.admin"),
    controller.get,
  )
  .patch(
    Validate(updateBookingAssign),
    getAuth("booking.assigns.edit", "master.admin"),
    controller.update,
  )

  .delete(
    Validate(deleteBookingAssign),
    getAuth("booking.assigns.delete", "master.admin"),
    controller.remove,
  );

module.exports = router;
