const events = require("events");
const bluebird = require("bluebird");
const eventsListener = new events.EventEmitter();
eventsListener.emitAsync = bluebird.promisifyAll(eventsListener.emit);
const Admin = require("../models/admin.model");
const mongoose = require("mongoose");
const s3 = require("../../config/s3");
const BookingAssign = require("../models/bookingAssign.model");
const Ticket = require("../models/ticket.model");
const Booking = require("../models/booking.model");

eventsListener.on("Delete-s3-Admin-Detail", async (adminId) => {
  try {
    const FolderName = process.env.S3_BUCKET_AGENTDOC;
    const admin = await Admin.findById(adminId);

    if (admin && admin.picture != null) {
      Admin.isValidURL(admin.picture)
        ? await s3.imageDelete(admin.picture, FolderName)
        : "";
    }

    if (admin && admin.details) {
      if (admin.details.document_gst_certificate != null) {
        Admin.isValidURL(admin.details.document_gst_certificate)
          ? await s3.imageDelete(
              admin.details.document_gst_certificate,
              FolderName,
            )
          : "";
      }
      if (admin.details.document_pan_card != null) {
        Admin.isValidURL(admin.details.document_pan_card)
          ? await s3.imageDelete(admin.details.document_pan_card, FolderName)
          : "";
      }
    }
  } catch (err) {
    console.log("err", err);
  }
});

eventsListener.on("UPDATE-TICKET", async (busId) => {
  const getBus = await Bus.findById(busId).populate({
    path: "buslayoutId",
    model: "Bus_Layout",
    select: "max_seats",
  });
  await Ticket.update(ticketId, getBus.buslayoutId.max_seats);
});

eventsListener.on("CREATE-TICKET", async (busId) => {
  const getBus = await Bus.findById(busId).populate({
    path: "buslayoutId",
    model: "Bus_Layout",
    select: "max_seats",
  });
  await Ticket.create(busId, getBus.buslayoutId.max_seats); //
});

eventsListener.on("REMOVE-TICKET", async (busId) => {
  await Ticket.remove(busId); //
});

eventsListener.on("UPDATE-BUS-BOOKING", async (busId, routeId) => {
  try {
    const bookingExist = await Booking.find({
      routeId,
      travel_status: "SCHEDULED",
    }).lean();
    if (bookingExist.length > 0) {
      const bookingIds = bookingExist.map((v, i) => v._id);
      await Booking.updateMany({ _id: { $in: bookingIds } }, { busId });
    }
  } catch (err) {
    console.log("err", err);
    return "err while : " + err;
  }
});

exports.eventsListener = eventsListener;
