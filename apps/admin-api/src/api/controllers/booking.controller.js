const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const pug = require("pug");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Setting = require("../models/setting.model");
const Booking = require("../models/booking.model");
const User = require("../models/user.model");
const Payment = require("../models/payment.model");
const Currency = require("../models/currency.model");
const { bookingChart } = require("../services/dashboardService");
const {
  bookingWithRefund,
  bookingWithoutRefund,
} = require("../services/bookingService");
/**
 * count payment
 * @returns
 */
exports.count = async (req, res, next) => {
  try {
    const payment_status = req.params.status.toUpperCase();
    const TODAY = req.params.start_date; // moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const YEAR_BEFORE = req.params.end_date; // moment().subtract(1, 'years').format("YYYY-MM-DD");

    let condition = {};
    condition = {
      travel_status: payment_status,
      booking_date: { $gte: new Date(YEAR_BEFORE), $lte: new Date(TODAY) },
    };

    const result = await bookingChart(TODAY, YEAR_BEFORE, condition);
    res.status(httpStatus.OK);
    res.json({
      message: "booking count fetched successfully.",
      years_data: result.length > 0 ? result[0].years_data : [],
      data: result.length ? result[0].data : [],
      status: true,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

/**
 * Get booking
 * @public
 */
exports.get = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate({ path: "pickupId", select: "_id title" })
      .populate({ path: "dropoffId", select: "_id title" })
      .populate({ path: "routeId", select: "_id title" })
      .populate({ path: "busId", select: "_id name reg_no model_no" })
      .populate({
        path: "userId",
        select: "_id firstname lastname phone email gender ",
      });
    // .populate({
    //   path: 'payments',
    //   select: '_id orderId payment_status is_pass payment_created createdAt method amount ferriOrderId paymentId passId',
    //   populate: { path: 'passId', select: '_id no_of_rides' },
    // });
    const formatedData = await Booking.transformSingleData(booking);
    const paymentDetail = await Payment.findOne({
      bookingId: { $in: [new mongoose.Types.ObjectId(formatedData.id)] },
    }).populate({ path: "passId", select: "no_of_rides" });
    formatedData.payment_detail =
      await Payment.transformSingleData(paymentDetail);
    formatedData.default_currency = await Currency.defaultPaymentCurrency();
    formatedData.payment_detail.default_currency =
      formatedData.default_currency;
    // console.log('formatedData', formatedData);
    res.status(httpStatus.OK);
    res.json({
      message: "booking fetched successfully.",
      data: formatedData,
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get booking layout list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    let condition = req.query.search
      ? {
          $or: [
            {
              pnr_no: {
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
          ],
          is_deleted: false,
        }
      : {
          // travel_status: req.query.travel_status.toUpperCase(),
          is_deleted: false,
        };

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    let newquery = {};
    if (req.query.startDate && req.query.endDate) {
      newquery = {
        booking_date: {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate),
        },
      };
    } else if (req.query.status) {
      newquery.status = req.query.status ? true : false;
      newquery.is_deleted = false;
    }
    condition = { ...condition, ...newquery };

    const aggregateQuery = Booking.aggregate([
      {
        $match: {
          is_deleted: false,
          ...(req.query.travel_status && {
            travel_status: req.query.travel_status.toUpperCase(),
          }),
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "pickupId",
          foreignField: "_id",
          as: "pickup_location",
        },
      },
      {
        $unwind: {
          path: "$pickup_location",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "dropoffId",
          foreignField: "_id",
          as: "drop_location",
        },
      },
      {
        $unwind: {
          path: "$drop_location",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "routes",
          localField: "routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: "$route",
      },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $lookup: {
          from: "bus_types",
          localField: "bus.bustypeId",
          foreignField: "_id",
          as: "bus_type",
        },
      },
      {
        $unwind: "$bus_type",
      },
      {
        $lookup: {
          from: "bus_layouts",
          localField: "bus.buslayoutId",
          foreignField: "_id",
          as: "bus_layout",
        },
      },
      {
        $unwind: "$bus_layout",
      },
      {
        $lookup: {
          from: "passengers",
          // localField: "_id",
          // foreignField: "bookingId",
          let: { booking_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$bookingId", "$$booking_id"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                fullname: 1,
                age: 1,
                gender: 1,
                seat: 1,
              },
            },
          ],
          as: "passengers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "payments",
          // localField: "_id",
          // foreignField: "bookingId",
          let: { booking_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$$booking_id", { $ifNull: ["$bookingId", []] }],
                },
                payment_type: { $in: ["trip", "pass"] },
              },
            },
            {
              $lookup: {
                from: "passes",
                let: { passId: "$passId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$passId"] } } },
                ],
                as: "pass",
              },
            },
            {
              $unwind: {
                path: "$pass",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                amount: 1,
                method: 1,
                is_pass: 1,
                payment_status: 1,
                payment_created_date: {
                  $toDate: {
                    $multiply: ["$payment_created", 1000], // Convert seconds to milliseconds
                  },
                },
                orderId: 1,
                no_of_pass_ride: { $ifNull: ["$pass.no_of_rides", "0"] },
              },
            },
          ],
          as: "payment",
        },
      },
      {
        $unwind: "$payment",
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          travel_status: 1,
          seat_nos: 1,
          has_return: {
            $cond: {
              if: { $eq: ["$has_return", true] },
              then: "1",
              else: "2",
            },
          },
          start_time: 1,
          start_date: 1,
          drop_date: { $ifNull: ["$drop_date", ""] },
          drop_time: { $ifNull: ["$drop_time", ""] },
          sub_total: {
            $toString: {
              $subtract: [
                { $toDecimal: { $ifNull: ["$sub_total", "0"] } },
                { $toDecimal: { $ifNull: ["$fee", "0"] } },
              ],
            },
          },
          discount: { $ifNull: ["$discount", ""] },
          booking_date: 1,
          date_time: "",
          tax: 1,
          tax_amount: 1,
          fee: 1,
          amount: {
            $concat: [DEFAULT_CURRENCY,"$final_total_fare"],
          },
          pnr_no: 1,
          distance: 1,
          passengers: { $ifNull: [{ $size: "$passengers" }, 0] },
          routeId: { $ifNull: ["$route._id", ""] },
          route_name: { $ifNull: ["$route.title", ""] },
          // pickupId: 1,
          pickup_location_title: { $ifNull: ["$pickup_location.title", "-"] },
          //stopping_points: `${item.pickupId.title} - ${item.dropoffId.title}<br/> from <small><b>${item.routeId.title}</b></small>`,
          //  dropoffId: 1,
          drop_location_title: { $ifNull: ["$drop_location.title", "-"] },
          //busId: { $ifNull: ["$bus._id", ""] },
          location: {
            route_name: { $ifNull: ["$route.title", ""] },
            drop_location: { $ifNull: ["$drop_location.title", "-"] },
            pickup_location: { $ifNull: ["$pickup_location.title", "-"] },
          },
          bus_name: { $ifNull: ["$bus.name", ""] },
          bus_model_no: { $ifNull: ["$bus.model_no", ""] },
          bus_reg_no: { $ifNull: ["$bus.reg_no", ""] },
          bus_type_name: { $ifNull: ["$bus_type.name", ""] },
          bus_layout_name: { $ifNull: ["$bus_layout.name", ""] },
          bus_layout_layout: { $ifNull: ["$bus_layout.layout", ""] },
          customer_name: {
            $ifNull: [{ $concat: ["$user.firstname", "$user.lastname"] }, ""],
          },
          customer_avatar: { $ifNull: ["$user.ProfilePic", ""] },
          customer_phone: { $ifNull: ["$user.phone", ""] },
          customer_email: { $ifNull: ["$user.email", ""] },
          userId: { $ifNull: ["$user._id", ""] },
          payment_status: { $ifNull: ["$payment.payment_status", ""] },
          payment_created: {
            $ifNull: [
              {
                $toDate: { $multiply: ["$payment.payment_created", 1000] },
              },
              "",
            ],
          },
          orderId: { $ifNull: ["$payment.orderId", ""] },
          is_pass: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$payment.is_pass", true] },
                  then: "Yes",
                  else: "NO",
                },
              },
              "",
            ],
          },
          no_of_pass: { $ifNull: ["$payment.no_of_pass_ride", ""] },
          paymentId: { $ifNull: ["$payment._id", ""] },
          payment_amount: { $ifNull: ["$payment.amount", ""] },
          payment_method: { $ifNull: ["$payment.method", "-"] },
          payment_details: { $ifNull: ["$payment", {}] },
          passenger_details: { $ifNull: ["$passengers", []] },

          createdAt: 1,
          is_deleted: 1,
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

    const result = await Booking.aggregatePaginate(aggregateQuery, options);

    res.json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get customer booking histories list
 * @public
 */
exports.bookingHistories = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    let condition = req.query.search
      ? {
          $or: [
            {
              bus_name: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              route_name: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              pnr_no: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              bus_model_no: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              orderId: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              paymentId: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
          ],
          is_deleted: false,
          //     travel_status: req.query.travel_status,
        }
      : {
          //   travel_status: req.query.travel_status,
          is_deleted: false,
        };

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc == "asc" ? 1 : -1 };
    } else {
      sort = { createdAt: -1 };
    }

    let filters = {};
    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);

      if (filtersData.type === "select") {
        console.log("name", filtersData.name, filtersData.selected_options[0]);
        filters = {
          travel_status: req.query.travel_status,
          is_deleted: false,
        };
      } else if (filtersData.type === "date") {
        const today = moment(filtersData.value.startDate);
        filters = {
          booking_date: {
            $gte: today.toDate(),
            $lte: today.endOf("day").toDate(),
          },
          travel_status: req.query.travel_status,
          is_deleted: false,
        };
      }
    }

    let newquery = {};
    if (req.query.startDate && req.query.endDate) {
      newquery = {
        booking_date: {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate),
        },
      };
    }
    condition = { ...condition, ...newquery };

    const aggregateQuery = Booking.aggregate([
      {
        $match: {
          is_deleted: false,
          userId: new mongoose.Types.ObjectId(customerId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "locations",
          localField: "pickupId",
          foreignField: "_id",
          as: "pickup_location",
        },
      },
      {
        $unwind: {
          path: "$pickup_location",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "dropoffId",
          foreignField: "_id",
          as: "drop_location",
        },
      },
      {
        $unwind: {
          path: "$drop_location",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "routes",
          localField: "routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: {
          path: "$route",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $lookup: {
          from: "passengers",
          // localField: "_id",
          // foreignField: "bookingId",
          let: { booking_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$bookingId", "$$booking_id"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                fullname: 1,
                age: 1,
                gender: 1,
                seat: 1,
              },
            },
          ],
          as: "passengers",
        },
      },

      {
        $lookup: {
          from: "payments",
          // localField: "_id",
          // foreignField: "bookingId",
          let: { booking_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$$booking_id", { $ifNull: ["$bookingId", []] }],
                },
                payment_type: { $in: ["trip", "pass"] },
              },
            },
            {
              $lookup: {
                from: "passes",
                let: { passId: "$passId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$passId"] } } },
                ],
                as: "pass",
              },
            },
            {
              $unwind: {
                path: "$pass",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                amount: 1,
                method: 1,
                payment_status: 1,
                is_pass: 1,
                payment_created_date: {
                  $toDate: {
                    $multiply: ["$payment_created", 1000], // Convert seconds to milliseconds
                  },
                },
                orderId: 1,
                currency_code: 1,
                no_of_pass_ride: { $ifNull: ["$pass.no_of_rides", "0"] },
              },
            },
          ],
          as: "payment",
        },
      },
      {
        $unwind: {
          path: "$payment",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          status: "$travel_status",
          customer_name: {
            $concat: ["$user.firstname", " ", "$user.lastname"],
          },
          customer_phone: {
            $concat: ["$user.country_code", " ", "$user.phone"],
          },
          seat_nos: 1,
          has_return: {
            $cond: {
              if: { $eq: ["$has_return", true] },
              then: "1",
              else: "2",
            },
          },
          start_time: 1,
          start_date: 1,
          drop_date: { $ifNull: ["$drop_date", ""] },
          drop_time: { $ifNull: ["$drop_time", ""] },
          sub_total: {
            $toString: {
              $subtract: [
                { $toDecimal: { $ifNull: ["$sub_total", "0"] } },
                { $toDecimal: { $ifNull: ["$fee", "0"] } },
              ],
            },
          },
          discount: { $ifNull: ["$discount", ""] },
          booking_date: 1,
          date_time: "",
          tax: 1,
          tax_amount: 1,
          fee: 1,
          amount: {
            $concat: [DEFAULT_CURRENCY, "", "$final_total_fare"],
          },
          pnr_no: 1,
          distance: 1,
          passengers: { $ifNull: [{ $size: "$passengers" }, 0] },
          route_name: { $ifNull: ["$route.title", ""] },
          location: {
            drop_location: { $ifNull: ["$drop_location.title", "-"] },
            pickup_location: { $ifNull: ["$pickup_location.title", "-"] },
          },
          bus_name: { $ifNull: ["$bus.name", ""] },
          bus_model_no: { $ifNull: ["$bus.model_no", ""] },
          bus_reg_no: { $ifNull: ["$bus.reg_no", ""] },
          payment_status: { $ifNull: ["$payment.payment_status", ""] },
          method: { $ifNull: ["$payment.method", ""] },
          payment_created: {
            $ifNull: [
              {
                $toDate: { $multiply: ["$payment.payment_created", 1000] },
              },
              "",
            ],
          },
          orderId: { $ifNull: ["$payment.orderId", ""] },
          is_pass: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$payment.is_pass", true] },
                  then: "Yes",
                  else: "NO",
                },
              },
              "",
            ],
          },
          no_of_pass: { $ifNull: ["$payment.no_of_pass_ride", ""] },
          payment_details: { $ifNull: ["$payment", {}] },
          passenger_details: { $ifNull: ["$passengers", []] },
          createdAt: 1,
          is_deleted: 1,
        },
      },
      {
        $match: condition,
      },
      {
        $match: filters,
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

    const result = await Booking.aggregatePaginate(aggregateQuery, options);
    const customer = await User.findById(customerId)
      .select("firstname lastname email country_code phone ")
      .lean();
    result.customer = customer;
    const getTotalRefundAmount = await Payment.aggregate([
      {
        $match: {
          is_deleted: false,
          userId: new mongoose.Types.ObjectId(customerId),
          payment_status: { $in: ["Refunded"] },
        },
      },
      {
        $addFields: {
          amountNum: { $toDouble: "$amount" },
        },
      },
      {
        $group: {
          _id: null,
          totalRefundAmount: {
            $sum: {
              $cond: [
                { $eq: ["$payment_status", "Refunded"] },
                "$amountNum",
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalRefundAmount: {
            $concat: [DEFAULT_CURRENCY, { $toString: "$totalRefundAmount" }],
          },
        },
      },
    ]);
    result.totalRefundAmount =
      getTotalRefundAmount.length > 0
        ? getTotalRefundAmount[0].totalRefundAmount
        : 0;
    const [totalScheduled, totalCancelled] = await Promise.all([
      Booking.countDocuments({
        is_deleted: false,
        userId: new mongoose.Types.ObjectId(customerId),
        travel_status: "SCHEDULED",
      }),
      Booking.countDocuments({
        is_deleted: false,
        userId: new mongoose.Types.ObjectId(customerId),
        travel_status: "CANCELLED",
      }),
    ]);

    result.totalScheduled = totalScheduled;
    result.totalCancelled = totalCancelled;

    res.status(httpStatus.OK);
    res.json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(httpStatus.NotFound);
      res.json({
        message: "No booking found.",
        status: false,
      });
      return;
    }
    booking.travel_status = status;
    await booking.save();
    res.status(httpStatus.OK);
    res.json({
      message: "Booking status updated successfully.",
      status: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get booking Cancel list
 * @public
 */
exports.cancel = async (req, res, next) => {
  const { is_refund } = req.body;
  const { pnr_no } = req.params;
  const session = await mongoose.startSession();
  try {
    // Start session
    await session.startTransaction();

    if (is_refund) {
      // /is refund
      const result = await bookingWithRefund(pnr_no);
      if (!result) {
        res.status(httpStatus.NotFound);
        res.json({
          message: "No booking pnr no found.",
          status: false,
        });
      }
    } else {
      const result = await bookingWithoutRefund(pnr_no);
      if (!result) {
        res.status(httpStatus.NotFound);
        res.json({
          message: "No booking pnr no found.",
          status: false,
        });
      }
    }
    // finish transcation
    await session.commitTransaction();
    session.endSession();

    res.status(httpStatus.OK);
    res.json({
      message: "booking cancelled successfully.",
      status: true,
    });
  } catch (error) {
    console.log(err);
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    next(error);
  }
};

/**
 * Download Invoice PDF
 * @public
 */
exports.downloadInvoice = async (req, res, next) => {
  let browser;
  try {
    const { pnr_no } = req.params;
    const booking = await Booking.findOne({ pnr_no, is_deleted: false })
      .populate({
        path: "userId",
        select: "firstname lastname phone email places",
      })
      .populate({ path: "pickupId", select: "title" })
      .populate({ path: "dropoffId", select: "title" })
      .populate({
        path: "offerId",
        select: "code discount_amount final_total_after_discount",
      });

    if (!booking) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "No booking found.",
        status: false,
      });
    }

    const company = await Setting.getgeneral();
    if (!company) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Company settings not found.",
        status: false,
      });
    }
    const payment = await Payment.findOne({
      bookingId: { $in: [booking._id] },
    }).populate({ path: "passId", select: "no_of_rides" });

    // Helper to convert images to base64 to avoid network requests in Puppeteer
    const imageToBase64 = (filePath) => {
      try {
        if (!filePath) return null;
        // If it's already a full URL, we can't easily base64 it without fetching
        if (filePath.startsWith("http")) return filePath;

        // Resolve local path
        const absolutePath = path.resolve(process.cwd(), filePath);
        if (fs.existsSync(absolutePath)) {
          const bitmap = fs.readFileSync(absolutePath);
          const extension = path.extname(absolutePath).replace(".", "");
          return `data:image/${extension === "jpg" ? "jpeg" : extension};base64,${bitmap.toString("base64")}`;
        }
        return null;
      } catch (e) {
        console.error("Base64 conversion error:", e);
        return null;
      }
    };

    const logoBase64 =
      imageToBase64(company.logo) || imageToBase64("public/images/nologo.png");
    const lightLogoBase64 = imageToBase64(company.light_logo) || logoBase64;

    const templateData = {
      pnr_no: booking.pnr_no,
      created_date: moment(booking.createdAt)
        .tz(DEFAULT_TIMEZONE)
        .format(DEFAULT_DATEFORMAT),
      method: payment ? payment.method : "N/A",
      company: {
        name: company.name || "Jaldi Ride",
        address: company.address || "",
        phone: company.phone || "",
        email: company.email || "",
        logo: logoBase64,
        light_logo: lightLogoBase64,
        site_description: company.site_description || "",
        primary_color: company.primary_color || "#3a8697",
      },
      customer: {
        fullname: booking.userId
          ? `${booking.userId.firstname} ${booking.userId.lastname}`
          : "Guest",
        address:
          (booking.userId && booking.userId.places.home.address) || "N/A",
        phone: (booking.userId && booking.userId.phone) || "N/A",
        email: (booking.userId && booking.userId.email) || "N/A",
      },
      pickup_name: booking.pickupId ? booking.pickupId.title : "N/A",
      dropoff_name: booking.dropoffId ? booking.dropoffId.title : "N/A",
      booking_date: moment(booking.booking_date)
        .tz(DEFAULT_TIMEZONE)
        .format(DEFAULT_DATEFORMAT),
      start_time: booking.start_time || "N/A",
      isPass: payment ? payment.is_pass : false,
      pass:
        payment && payment.passId
          ? { no_of_rides: payment.passId.no_of_rides }
          : null,
      sub_total: booking.sub_total || "0",
      tax_amount: booking.tax_amount || "0",
      isOffer: !!booking.offerId,
      offer: booking.offerId
        ? {
            code: booking.offerId.code,
            discount_amount: booking.discount || 0,
            final_total_after_discount: booking.final_total_fare,
          }
        : null,
      final_total_fare: booking.final_total_fare || "0",
    };

    const templatePath = path.join(__dirname, "../templates/invoice.pug");
    const html = pug.renderFile(templatePath, templateData);
    console.log("Invoice HTML Length:", html.length);
    console.log(
      "Data - PNR:",
      templateData.pnr_no,
      "Customer:",
      templateData.customer.fullname,
    );

    // Launch browser with stable flags
    try {
      browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        headless: true, // Use true as requested by user
        dumpio: true, // Show Chromium logs in Docker console
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
          "--font-render-hinting=none",
        ],
      });
    } catch (launchError) {
      console.error("Puppeteer Launch Error:", launchError);
      throw new Error("Could not start PDF engine. Please contact support.");
    }

    const page = await browser.newPage();

    // Set content and wait for it to be fully rendered
    await page.setContent(html, {
      waitUntil: "networkidle0", // Changed from networkidle0 to load for Alpine stability
      timeout: 60000,
    });

    // Small delay to ensure everything is rendered
    await new Promise((r) => setTimeout(r, 1000));

    // Explicitly emulate screen to ensure CSS is applied
    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      preferCSSPageSize: true,
      headerTemplate: "<span></span>",
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; border-top: 1px solid #ccc; padding-top: 5px; margin: 0 10mm; display: flex; justify-content: space-between; font-family: Helvetica, Arial, sans-serif;">
          <span>Created at: ${moment().tz(DEFAULT_TIMEZONE).format("LLL")}</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
      margin: {
        top: "15mm",
        bottom: "20mm",
        left: "10mm",
        right: "10mm",
      },
      timeout: 60000,
    });

    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${pnr_no}.pdf`,
    );
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    console.error("PDF Generation Error:", error);
    next(error);
  }
};
