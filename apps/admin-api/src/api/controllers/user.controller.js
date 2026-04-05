const httpStatus = require("http-status");
const { omit } = require("lodash");
const mongoose = require("mongoose");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
const Booking = require("../models/booking.model");
const BookingLog = require("../models/bookingLog.model");
const Payment = require("../models/payment.model");
const Passenger = require("../models/passenger.model");
const { demoMode } = require("../../config/vars");
const { applyMasking } = require("../utils/masker");

/**
 * Get user
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const getuser = await User.aggregate([
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "users",
          as: "wallets",
        },
      },
      {
        $match: { _id: userId },
      },
      {
        $unwind: {
          path: "$wallets",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          firstname: 1,
          lastname: 1,
          gender: 1,
          email: 1,
          phone: 1,
          country_code: 1,
          picture: "$ProfilePic",
          refercode: 1,
          status: 1,
          createdAt: 1,
          wallet_balance: {
            $ifNull: [
              {
                $concat: [DEFAULT_CURRENCY, { $toString: "$wallets.amount" }],
              },
              0,
            ],
          },
        },
      },
    ]);

    if (!getuser.length) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found.",
        status: false,
      });
    }

    const total_bookings = await Booking.countDocuments({
      userId: userId,
      is_deleted: false,
    });

    const paymentStats = await Payment.aggregate([
      {
        $match: {
          userId: userId,
          is_deleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalSpentTrip: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$payment_type", "trip"] },
                    { $eq: ["$payment_status", "Completed"] },
                  ],
                },
                { $toDouble: "$amount" },
                0,
              ],
            },
          },
          totalSpentPass: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$payment_type", "pass"] },
                    { $eq: ["$payment_status", "Completed"] },
                  ],
                },
                { $toDouble: "$amount" },
                0,
              ],
            },
          },
          totalRefund: {
            $sum: {
              $cond: [
                { $eq: ["$payment_status", "Refunded"] },
                { $toDouble: "$amount" },
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats =
      paymentStats.length > 0
        ? paymentStats[0]
        : { totalSpentTrip: 0, totalSpentPass: 0, totalRefund: 0 };

    const recentScheduledBookings = await Booking.find({
      userId: userId,
      travel_status: "SCHEDULED",
      is_deleted: false,
    })
      .limit(4)
      .sort({ createdAt: -1 })
      .populate({ path: "pickupId", select: "title" })
      .populate({ path: "dropoffId", select: "title" })
      .populate({ path: "routeId", select: "title" })
      .populate({ path: "busId", select: "name model_no" })
      .populate({
        path: "userId",
        select: "firstname lastname email phone gender",
      });

    const formattedRecentBookings = await Booking.transformData(
      recentScheduledBookings,
    );

    const data = {
      ...getuser[0],
      total_bookings,
      total_spent_trip: DEFAULT_CURRENCY + stats.totalSpentTrip,
      total_spent_pass: DEFAULT_CURRENCY + stats.totalSpentPass,
      total_refund: DEFAULT_CURRENCY + stats.totalRefund,
      recent_bookings: formattedRecentBookings,
    };

    res.json({
      status: true,
      data: demoMode ? applyMasking(data, true) : data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get logged in user info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.user.transform());

/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(httpStatus.CREATED);
    res.json({
      message: "User created successfully.",
      user: savedUser,
      status: true,
    });
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { user } = req.locals;
    const newUser = new User(req.body);
    const ommitRole = user.role !== "admin" ? "role" : "";
    const newUserObject = omit(newUser.toObject(), "_id", ommitRole);
    console.log(newUserObject);
    await user.updateOne(newUserObject, { override: true, upsert: true });
    const savedUser = await User.findById(user._id);

    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

// const ommitRole = req.locals.user.role !== "admin" ? "role" : "";
// const updatedUser = omit(req.body, ommitRole);
// const user = Object.assign(req.locals.user, updatedUser);

// user
//   .save()
//   .then((savedUser) => {
//     const userTransformed = savedUser.transform();
//     userTransformed.picture = `${process.env.BASE_URL}${userTransformed.picture}`;
//     res.json(userTransformed);
//   })
//   .catch(e => next(User.checkDuplicateEmail(e)));
/**
 * Get user list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    let condition = req.query.search
      ? {
          $or: [
            {
              wallet_balance: {
                $regex:
                  "(s+" + req.query.search + "|^" + req.query.search + ")",
                $options: "i",
              },
            },
            {
              fullname: {
                $regex:
                  "(s+" + req.query.search + "|^" + req.query.search + ")",
                $options: "i",
              },
            },
            {
              email: {
                $regex:
                  "(s+" + req.query.search + "|^" + req.query.search + ")",
                $options: "i",
              },
            },
            {
              phone: {
                $regex:
                  "(s+" + req.query.search + "|^" + req.query.search + ")",
                $options: "i",
              },
            },
            {
              gender: {
                $regex:
                  "(s+" + req.query.search + "|^" + req.query.search + ")",
                $options: "i",
              },
            },
            {
              refercode: {
                $regex:
                  "(s+" + req.query.search + "|^" + req.query.search + ")",
                $options: "i",
              },
            },
          ],
          is_deleted: req.query.is_deleted,
          phone: { $ne: "" },
          email: { $ne: "" },
        }
      : {
          is_deleted: req.query.is_deleted,
          phone: { $ne: "" },
          email: { $ne: "" },
        };

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    let dateRange = {};
    if (req.query.startDate && req.query.endDate) {
      dateRange = {
        createdAt: {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate),
        },
      };
    }

    const aggregateQuery = User.aggregate([
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "users",
          as: "wallet",
        },
      },
      {
        $unwind: "$wallet",
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          is_deleted: 1,
          firstname: 1,
          lastname: 1,
          fullname: { $concat: ["$firstname", " ", "$lastname"] },
          gender: 1,
          email: 1,
          phone: 1,
          country_code: 1,
          language: 1,
          createdAt: 1,
          refercode: 1,
          status: 1,
          picture: "$ProfilePic",
          wallet_balance: {
            $ifNull: [
              {
                $concat: [DEFAULT_CURRENCY, { $toString: "$wallet.amount" }],
              },
              0,
            ],
          },
          walletId: { $ifNull: ["$wallet._id", null] },
        },
      },
      {
        $match: condition,
      },
      {
        $match: dateRange,
      },
      {
        $match: {
          status:
            req.query.type == "all"
              ? { $in: [true, false] }
              : req.query.type == "deleted"
                ? { $in: [true, false] }
                : false,
        },
      },
    ]);

    const options = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
    };

    const result = await User.aggregatePaginate(aggregateQuery, options);

    if (demoMode) {
      result.items = applyMasking(result.items, true);
    }

    res.json(result);
  } catch (error) {
    console.log("err ", error);
    next(error);
  }
};

exports.search = async (req, res, next) => {
  try {
    const { search } = req.query;
    const condition = search
      ? {
          $or: [
            {
              firstname: { $regex: `(\s+${search}|^${search})`, $options: "i" },
            },
            { lastname: { $regex: new RegExp(search), $options: "i" } },
            { phone: { $regex: new RegExp(search), $options: "i" } },
            { email: { $regex: new RegExp(search), $options: "i" } },
          ],
          is_deleted: false,
        }
      : { is_deleted: false };
    const result = await User.find(condition).populate("wallets").lean();
    res.json({
      total_count: result.length,
      items: demoMode
        ? applyMasking(await User.formatUser(result), true)
        : await User.formatUser(result),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const { firstname, lastname, email, country_code, phone, status } =
      req.body;
    const update = {
      firstname,
      lastname,
      email,
      phone,
      country_code,
      status,
    };
    const updateusers = await User.findByIdAndUpdate(
      req.params.userId,
      update,
      {
        returnDocument: "after",
      },
    );
    res.status(httpStatus.OK);
    res.json({
      status: true,
      message: "customer update successfully.",
      data: updateusers,
    });
  } catch (e) {
    next(User.checkDuplicateEmail(e));
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, {
      status: req.body.status,
    });
    res.status(httpStatus.OK);
    res.json({
      message: "User status updated.",
      data: user,
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.walletHistories = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const condition = req.query.search
      ? {
          $or: [
            {
              title: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              amount: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              payment_status: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              payment_type: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
          ],
          userId,
        }
      : { userId };

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    const aggregateQuery = Payment.aggregate([
      {
        $match: {
          ...condition,
          ...filters,
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
        $project: {
          _id: 0,
          id: "$_id",
          title: 1,
          status: { $cond: [{ $eq: ["$type", 0] }, "credit", "debit"] },
          type: { $cond: [{ $eq: ["$type", 0] }, "credit", "debit"] },
          payment_status: 1,
          payment_type: 1,
          method: { $ifNull: ["$method", "-"] },
          amount: {
            $concat: [
              DEFAULT_CURRENCY,
              { $toString: { $ifNull: ["$amount", 0] } },
            ],
          },
          is_pass: { $cond: [{ $ifNull: ["$is_pass", "No"] }, "Yes", "No"] },
          user: "$user",
          createdAt: 1,
        },
      },
    ]);

    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
      lean: true,
    };

    const result = await Payment.aggregatePaginate(
      aggregateQuery,
      paginationoptions,
    );
    const user = await User.findById(userId).populate("wallets").lean();
    result.customer = {
      picture: user.ProfilePic,
      fullname: user.firstname + " " + user.lastname,
      phone: user.phone,
      email: user.email,
      wallet_balance: user.wallets
        ? DEFAULT_CURRENCY + " " + user.wallets.amount
        : 0,
    };
    if (demoMode) {
      result.customer = applyMasking(result.customer, true);
      result.items = result.items.map((item) => {
        if (item.user) item.user = applyMasking(item.user, true);
        return item;
      });
    }
    res.json(result);
  } catch (err) {
    console.log("err ", err);
    next(err);
  }
};

/**
 * Delete user
 * @public
 */
exports.remove = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const checkUser = await User.exists({ _id: req.params.userId });
    if (checkUser) {
      if (await Booking.findOne({ userId: req.params.userId })) {
        const updateUser = await User.updateOne(
          {
            _id: req.params.userId,
          },
          { is_deleted: true, deletedAt: new Date() },
        );
        if (updateUser) {
          const updateWallet = await Wallet.updateOne({
            users: req.params.userId,
            is_deleted: true,
          });

          if (updateWallet) {
            if (Booking.exists({ userId: req.params.userId })) {
              await Booking.updateOne(
                {
                  userId: req.params.userId,
                },
                { is_deleted: true },
              );
            }
            if (Passenger.exists({ userId: req.params.userId })) {
              await Passenger.updateOne(
                {
                  userId: req.params.userId,
                },
                { is_deleted: true },
              );
            }

            if (Payment.exists({ userId: req.params.userId })) {
              await Payment.updateOne(
                {
                  userId: req.params.userId,
                },
                { is_deleted: true },
              );
            }
            res.status(httpStatus.OK).json({
              status: true,
              message: " customer deleted successfully.",
            });
          } else {
            res.status(httpStatus.OK).json({
              status: false,
              message: " customer deleted but wallet not found.",
            });
          }
        } else {
          res.status(httpStatus.OK).json({
            status: false,
            message: "customer not deleted.",
          });
        }
      } else {
        await User.deleteOne({ _id: req.params.userId });
        await Wallet.deleteOne({ users: req.params.userId });
        res.status(httpStatus.OK).json({
          status: true,
          message: "customer  deleted permanently",
        });
      }
    } else {
      res.status(httpStatus.OK).json({
        status: false,
        message: " customer not found.",
      });
    }
    await session.commitTransaction();
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    next(err);
  } finally {
    // ending the session
    session.endSession();
  }
};

/**
 * Delete Permanently user and all associated records
 * @public
 */
exports.removePermanently = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.params.userId;

    // 1. Check if user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: false,
        message: "Customer not found.",
      });
    }

    // 2. Delete from all related collections
    // Using deleteMany for collections that might have multiple records
    await Promise.all([
      User.deleteOne({ _id: userId }).session(session),
      Wallet.deleteMany({ users: userId }).session(session),
      Booking.deleteMany({ userId: userId }).session(session),
      Passenger.deleteMany({ userId: userId }).session(session),
      Payment.deleteMany({ userId: userId }).session(session),
      BookingLog.deleteMany({ userId: userId }).session(session),
    ]);

    await session.commitTransaction();

    res.status(httpStatus.OK).json({
      status: true,
      message: "Customer and all associated data permanently deleted.",
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Permanent Delete Error:", err);
    next(err);
  } finally {
    session.endSession();
  }
};
