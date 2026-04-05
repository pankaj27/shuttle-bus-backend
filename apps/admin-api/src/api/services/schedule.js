const _ = require("lodash");

const scheduleLib = require("node-schedule");
const firebaseUser = require("./firebaseUser");
const User = require("../models/user.model");
const Driver = require("../models/driver.model");
const Setting = require("../models/setting.model");
const ScheduledNotification = require("../models/scheduledNotification.model");
const { notificationQueue } = require("./queueService");

const schedule = {};
const moment = require("moment-timezone");

const { spawn } = require("child_process");
const path = require("path");

schedule.backupDB = function () {
  scheduleLib.scheduleJob("* */24 * * *", () => {
    const DB_NAME = "busferri";
    const Time = moment().unix();

    const ARCHIVE_PATH = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "backup",
      `${DB_NAME}-${Time}.gzip`,
    );
    console.log("ARCHIVE_PATH", ARCHIVE_PATH, "Time", Time);

    const child = spawn("mongodump", [
      `--db=${DB_NAME}`,
      `--archive=${ARCHIVE_PATH}`,
      "--gzip",
      // `--username=${DB_NAME}`,
      // '--password=BusFerri2021MSXBF',
    ]);

    child.stdout.on("data", (data) => {
      console.log("stdout:\n", data);
    });
    child.stderr.on("data", (data) => {
      console.log("stderr:\n", Buffer.from(data).toString());
    });
    child.on("error", (error) => {
      console.log("error:\n", error);
    });

    child.on("exit", (code, signal) => {
      if (code) console.log("Process exit with code:", code);
      else if (signal) console.log("Process killed with signal:", signal);
      else console.log("Backup is successfull ✅");
    });
  });
};

schedule.getJobs = function () {
  return scheduleLib.scheduledJobs;
};

schedule.scheduleJob = function (getData) {
  const dayOfWeek = getData.days.join(",");

  // Parse the input time safely
  let hours, minutes;
  if (typeof getData.time === "string" && /^\d{2}:\d{2}$/.test(getData.time)) {
    [hours, minutes] = getData.time.split(":");
  } else {
    const parsedDateTime = moment(getData.time).tz(DEFAULT_TIMEZONE);
    hours = parsedDateTime.format("HH");
    minutes = parsedDateTime.format("mm");
  }

  console.log(`Scheduling job for ${hours}:${minutes} on days ${dayOfWeek}`);

  const scheduleId = getData._id.toString();

  scheduleLib.scheduleJob(
    scheduleId,
    { rule: `${minutes} ${hours} * * ${dayOfWeek}`, tz: DEFAULT_TIMEZONE },
    async () => {
      let Model;
      if (getData.user_type === "CUSTOMER") {
        Model = User;
      } else if (getData.user_type === "DRIVER") {
        Model = Driver;
      }

      let users = [];
      if (Model) {
        if (getData.to === "to_specific") {
          users = await Model.find(
            {
              _id: { $in: getData.users },
              status: true,
              is_deleted: false,
              device_token: { $nin: [null, ""] },
            },
            "device_token",
          );
        } else {
          users = await Model.find(
            {
              status: true,
              is_deleted: false,
              device_token: { $nin: [null, ""] },
            },
            "device_token",
          );
        }
      }

      const chunks = _.chunk(users, 500);

      for (const u of chunks) {
        const tokens = [];

        u.forEach((item) => {
          if (item.device_token) {
            tokens.push(item.device_token);
          }
        });

        const payload = {
          tokens,
          title: getData.notification.title,
          body: getData.notification.body,
          picture: getData.notification.picture,
        };

        // Enqueue job to BullMQ
        await notificationQueue.add("send-multicast", {
          type: "multicast",
          payload,
          scheduleId,
        });
      }
    },
  );
};

schedule.createSchedule = async function (data) {
  try {
    const scheduledNotification = new ScheduledNotification({
      to: data.to,
      time: data.time,
      days: data.days,
      user_type: data.user_type,
      notification: data.notification,
      message_type: data.message_type,
      schedule: data.schedule,
      users: data.users,
    });

    const getData = await scheduledNotification.save();
    this.scheduleJob(getData);
  } catch (e) {
    console.log("asdasd", e);
    throw e;
  }
};

schedule.reSchedule = async function () {
  try {
    console.log("----------- reSchedule notifications ----------------");

    const scheduledNotifications = await ScheduledNotification.find({
      to: { $in: ["to_all", "to_specific"] },
    });
    const getSetting = await Setting.findOne({}, "general").lean();
    const timeZone = getSetting?.general?.timezone || "Asia/Kolkata";

    scheduledNotifications.forEach((scheduledNotification) => {
      const dayOfWeek = scheduledNotification.days.join(",");

      // Parse the input time safely
      let hours, minutes;
      if (
        typeof scheduledNotification.time === "string" &&
        /^\d{2}:\d{2}$/.test(scheduledNotification.time)
      ) {
        [hours, minutes] = scheduledNotification.time.split(":");
      } else {
        const parsedDateTime = moment(scheduledNotification.time).tz(timeZone);
        hours = parsedDateTime.format("HH");
        minutes = parsedDateTime.format("mm");
      }

      const scheduleId = scheduledNotification._id.toString();

      scheduleLib.scheduleJob(
        scheduleId,
        { rule: `${minutes} ${hours} * * ${dayOfWeek}`, tz: timeZone },
        async () => {
          let Model;
          if (scheduledNotification.user_type === "CUSTOMER") {
            Model = User;
          } else if (scheduledNotification.user_type === "DRIVER") {
            Model = Driver;
          }

          let users = [];
          if (Model) {
            if (scheduledNotification.to === "to_specific") {
              users = await Model.find(
                {
                  _id: { $in: scheduledNotification.users },
                  status: true,
                  is_deleted: false,
                  device_token: { $nin: [null, ""] },
                },
                "device_token",
              );
            } else {
              users = await Model.find(
                {
                  status: true,
                  is_deleted: false,
                  device_token: { $nin: [null, ""] },
                },
                "device_token",
              );
            }
          }

          const chunks = _.chunk(users, 500);

          for (const u of chunks) {
            const tokens = [];

            u.forEach((item) => {
              if (item.device_token) {
                tokens.push(item.device_token);
              }
            });

            const payload = {
              tokens,
              title: scheduledNotification.notification.title,
              body: scheduledNotification.notification.body,
              picture: scheduledNotification.notification.picture,
            };

            // Enqueue job to BullMQ
            await notificationQueue.add("send-multicast", {
              type: "multicast",
              payload,
              scheduleId,
            });
          }
        },
      );
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
};

module.exports = schedule;
