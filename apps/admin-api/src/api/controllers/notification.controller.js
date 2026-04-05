const httpStatus = require("http-status");
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");
const schedule = require("../services/schedule");
const { imageDelete, imageUpload } = require("../services/uploaderService");
const ScheduledNotification = require("../models/scheduledNotification.model");
const firebaseUser = require("../services/firebaseUser");
const User = require("../models/user.model");
const Driver = require("../models/driver.model");
const { notificationQueue } = require("../services/queueService");

const sendNow = async (scheduledNotification) => {
  let Model;
  if (scheduledNotification.user_type === "CUSTOMER") {
    Model = User;
  } else if (scheduledNotification.user_type === "DRIVER") {
    Model = Driver;
  }

  if (Model) {
    let users = [];
    if (scheduledNotification.to === "to_all") {
      users = await Model.find(
        {
          status: true,
          is_deleted: false,
          device_token: { $nin: [null, ""] },
        },
        "device_token",
      );
    } else {
      users = await Model.find({
        _id: { $in: scheduledNotification.users },
        status: true,
        is_deleted: false,
        device_token: { $nin: [null, ""] },
      }).select("device_token device_type");
    }

    const chunks = _.chunk(users, 500);

    for (const chunk of chunks) {
      const tokens = chunk.map((u) => u.device_token).filter((t) => t);
      if (tokens.length === 0) continue;

      console.log(
        `Enqueuing ${
          scheduledNotification.to === "to_all" ? "to-all" : "multicast"
        } job for ${tokens.length} tokens...`,
      );
      await notificationQueue.add(
        scheduledNotification.to === "to_all"
          ? "send-to-all"
          : "send-multicast",
        {
          type: "multicast",
          scheduleId: scheduledNotification._id,
          payload: {
            tokens,
            title: scheduledNotification.notification.title,
            body: scheduledNotification.notification.body,
            picture: scheduledNotification.notification.picture,
            user_type: scheduledNotification.user_type,
          },
        },
      );
    }
  }
};

/**
 * get notifications list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    let condition = req.query.search
      ? {
          $or: [
            {
              to: {
                $regex:
                  "(\s+" + req.query.search + "|^" + req.query.search + ")",
                $options: "i",
              },
            },
            {
              user_type: {
                $regex:
                  "(\s+" + req.query.search + "|^" + req.query.search + ")",
                $options: "i",
              },
            },
            // { type: req.query.search },
          ],
        }
      : {};

    let sort = {};
    if (!req.query.sort) {
      sort = { _id: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = {
        [data.name]: data.order != "none" ? data.order : "asc",
      };
    }

    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);
      condition = {
        [filtersData.name]: filtersData.selected_options[0],
      };
    }

    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
      lean: true,
    };

    const result = await ScheduledNotification.paginate(
      condition,
      paginationoptions,
    );
    result.items = ScheduledNotification.transformData(result.items);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * post notifications create
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const payload = {
      to: req.body.to,
      days: req.body.days,
      time: req.body.time,
      days: req.body.days,
      user_type: req.body.user_type,
      message_type: req.body.message_type,
      schedule: req.body.schedule,
      notification: req.body.notification,
      users: req.body.user_ids,
      status: req.body.status,
    };

    if (req.body.picture) {
      const uploadedUrl = await imageUpload(
        req.body.picture,
        uuidv4(),
        "notifications",
      );

      payload.notification.picture = uploadedUrl;
    } else {
      payload.notification.picture = "";
    }

    if (payload.schedule === "immediately") {
      const time = moment().tz(DEFAULT_TIMEZONE).format("HH:mm");
      const days = [moment().tz(DEFAULT_TIMEZONE).day()];

      payload.time = payload.time || time;
      payload.days = payload.days || days;

      const scheduledNotification = new ScheduledNotification({
        to: payload.to,
        time: payload.time,
        days: payload.days,
        user_type: payload.user_type,
        notification: payload.notification,
        message_type: payload.message_type,
        schedule: payload.schedule,
        status: payload.status,
        users: payload.to === "to_all" ? [] : payload.users,
        send_total: {
          success_count: 0,
          failed_count: 0,
        },
      });

      await scheduledNotification.save();
      await sendNow(scheduledNotification);
    } else {
      await schedule.createSchedule(payload);
    }

    res.status(httpStatus.OK);
    res.json({
      message: "notification created successfully.",
      status: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * update notifications
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const existingNotification =
      await ScheduledNotification.findById(notificationId);

    if (!existingNotification) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Notification not found",
        status: false,
      });
    }

    const payload = {
      to: req.body.to || existingNotification.to,
      days: req.body.days || existingNotification.days,
      time: req.body.time || existingNotification.time,
      user_type: req.body.user_type || existingNotification.user_type,
      message_type: req.body.message_type || existingNotification.message_type,
      schedule: req.body.schedule || existingNotification.schedule,
      notification: req.body.notification || existingNotification.notification,
      users: req.body.user_ids || existingNotification.users,
      status:
        req.body.status !== undefined
          ? req.body.status
          : existingNotification.status,
    };

    if (req.body.picture) {
      // Delete old picture if exists
      if (
        existingNotification.notification &&
        existingNotification.notification.picture
      ) {
        await imageDelete(
          existingNotification.notification.picture,
          "notifications",
        );
      }

      const uploadedUrl = await imageUpload(
        req.body.picture,
        uuidv4(),
        "notifications",
      );

      if (!payload.notification) payload.notification = {};
      payload.notification.picture = uploadedUrl;
    } else if (
      existingNotification.notification &&
      existingNotification.notification.picture
    ) {
      if (!payload.notification) payload.notification = {};
      payload.notification.picture = existingNotification.notification.picture;
    }

    if (payload.schedule === "immediately") {
      payload.time = moment().tz(DEFAULT_TIMEZONE).format("HH:mm");
      payload.days = [moment().tz(DEFAULT_TIMEZONE).day()];
      payload.send_total = { success_count: 0, failed_count: 0 };
    }

    // Update DB
    const updatedNotification = await ScheduledNotification.findByIdAndUpdate(
      notificationId,
      { $set: payload },
      { new: true },
    );

    // Handle rescheduling if it's a scheduled job
    const list = schedule.getJobs();
    const currentJob = list[notificationId];
    if (currentJob) {
      currentJob.cancel();
    }

    if (payload.status) {
      if (payload.schedule === "immediately") {
        await sendNow(updatedNotification);
      } else {
        schedule.scheduleJob(updatedNotification);
      }
    }

    res.json({
      message: "notification updated successfully.",
      status: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * update  notifications status
 * @public
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const notificationId = req.params.id;

    const result = await ScheduledNotification.updateStatus(
      notificationId,
      req.body.status,
    );
    if (result.matchedCount > 0) {
      res.status(httpStatus.OK);
      res.json({
        message: `notification is ${req.body.status}.`,
        status: true,
      });
    } else {
      res.status(httpStatus.OK);
      res.json({
        message: "notification status failed.",
        status: false,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * delete notifications create
 * @public
 */
exports.remove = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const list = schedule.getJobs();
    console.log("list", list);
    const currentJob = list[jobId];

    // 1. Fetch notification and handle image cleanup if it exists
    const getSN = await ScheduledNotification.findById(jobId);
    if (getSN) {
      if (getSN.notification && getSN.notification.picture) {
        await imageDelete(getSN.notification.picture, "notifications");
      }
      // 2. Delete from database
      await ScheduledNotification.findByIdAndDelete(jobId);
    }

    // 3. Cancel scheduled job if it exists
    if (currentJob) {
      currentJob.cancel();
    }

    res.json({
      status: true,
      message: "Delete successfull",
    });
  } catch (error) {
    next(error);
  }
};
