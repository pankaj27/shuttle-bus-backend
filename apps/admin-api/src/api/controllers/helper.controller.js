const httpStatus = require("http-status");
const mongoose = require("mongoose");
const Helper = require("../models/helper.model");
const Reply = require("../models/reply.model");
const User = require("../models/user.model");
//const userFCM = require("../notifications/user")
const firebaseUser = require("../services/firebaseUser");
const userNotification = require("../models/userNotification.model");

/**
 * Get location list
 * @public
 */

exports.list = async (req, res, next) => {
  try {
    // const locations = await Location.list(req.query);
    // const transformedUsers = locations.map(location => location.transform());
    let condition = req.query.search
      ? {
          $or: [
            {
              ticket_no: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              firstname: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              lastname: { $regex: new RegExp(req.query.search), $options: "i" },
            },
            { email: { $regex: new RegExp(req.query.search), $options: "i" } },
            { gender: { $regex: new RegExp(req.query.search), $options: "i" } },
            // { phone:  { $regex: new RegExp(req.query.search), $options: 'i' } },
            {
              helpemail: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            // { contact:  { $regex: new RegExp(req.query.search), $options: 'i' } }
          ],
        }
      : {};

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }
let newquery = {};
    if (req.query.startDate && req.query.endDate) {
      newquery.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

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
    const aggregateQuery = Helper.aggregate([
      {
        $lookup:{
          from: "replies",
          let: { helperId: "$_id" },
          pipeline: [
            { $match:
               { $expr:
                  { $eq: ["$$helperId", "$helperId"] }
               }
            },
            {
              $project: {
                _id:0,
                title: 1,
                content: 1,
                createdAt: 1
              }
            }
          ],
          as: "replies"
        }
      },
      {
        $unwind: {
          path: "$replies",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          ids: "$_id",
          userId:1,
          ticket_no: 1,
          fullname: { $concat: ["$firstname", " ", "$lastname"] },
          email: 1,
          phone: 1,
          helpemail: 1,
          contact: 1,
          status: 1,
          description_short: { $substr: ["$description", 0, 10] },
          description: 1,
          createdAt: 1,
          replies: "$replies"
        },
      },
      {
        $match: condition,
      },
      {
        $match: newquery
      }
    ]);

    const result = await Helper.aggregatePaginate(
      aggregateQuery,
      paginationoptions
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.reply = async (req, res, next) => {
  try {
    let helperId = req.params.helperId;
    const { userId, title, content, type, status } = req.body;
    const helperStatus = status || "Replied";

    const adminId = req.user._id;
    const helper = await Helper.findById(helperId);
    if (!helper) {
      res.status(httpStatus.OK);
      res.json({
        message: "Ticket not found.",
        status: false,
      });
      return;
    }

    if (!(await User.exists({ _id: userId }))) {
      res.status(httpStatus.OK);
      res.json({
        message: "Customer not found.",
        status: false,
      });
      return;
    }

    const user = await User.findOne({ _id: userId }).lean();

    if (type === "notification") {
      const saveObj = {
        adminId,
        helperId,
        userId,
        title,
        content,
      };
      const session = await mongoose.startSession();
      let saveReply;
      try {
        await session.withTransaction(async () => {
          saveReply = await new Reply(saveObj).save({ session });
          await Helper.updateOne(
            { _id: helperId },
            { status: helperStatus },
            { session }
          );
        });
      } finally {
        session.endSession();
      }

      if (!saveReply) {
        throw new Error("Failed to save reply");
      }

      const notificationTitle = `Help and Support: ${saveReply.title} `;
      const notificationBody = `Ticket no: ${helper.ticket_no}\n${saveReply.content}`;
      if (user && user.device_token) {
        const payload = {
          token: user.device_token,
          title: notificationTitle,
          body: notificationBody,
          picture: "",
        };
        try {
          await firebaseUser.sendSingleMessage(payload);
        } catch (err) {
          // Swallow notification delivery errors so the reply flow still succeeds
          console.error("Failed to send Firebase notification:", err.message);
        }
      }
      userNotification.create(
        "support",
        notificationTitle,
        notificationBody,
        userId,
        adminId,
        {
          helperId: helperId,
          replyId: saveReply._id,
        }
      );
      res.status(httpStatus.CREATED);
      res.json({
        message: `Reply sent successfully.`,
        data: {},
        status: true,
      });
    } else if (type === "email") {
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Helper
 * @public
 */
exports.remove = (req, res, next) => {
  Helper.deleteOne({ _id: req.params.helperId })
    .then(async () => {
      await userNotification.deleteOne({
        helperId: new mongoose.Types.ObjectId(req.params.helperId),
      });
      await Reply.deleteOne({
        helperId: new mongoose.Types.ObjectId(req.params.helperId),
      });
      res.status(httpStatus.OK).json({
        status: true,
        message: "Deleted successfully.",
      });
    })
    .catch((e) => next(e));
};
