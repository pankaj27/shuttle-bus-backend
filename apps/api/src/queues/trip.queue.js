const { Queue } = require("bullmq");
const { connection } = require("../config/redis");

const tripQueue = new Queue("trip", { connection });

/**
 * Schedule daily reset of trip_status to ASSIGNED at 12:05 AM
 */
async function addDailyResetJob() {
  await tripQueue.add(
    "daily-reset",
    {},
    {
      repeat: { pattern: "05 00 * * *" },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
}

/**
 * Schedule daily expiry check at 1:00 AM
 */
async function addDailyExpiryJob() {
  await tripQueue.add(
    "daily-expiry",
    {},
    {
      repeat: { pattern: "00 01 * * *" },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
}

/**
 * Schedule minute-by-minute status sync
 */
async function addMinuteCheckJob() {
  await tripQueue.add(
    "minute-check",
    {},
    {
      repeat: { pattern: "* * * * *" },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
}

module.exports = {
  tripQueue,
  addDailyResetJob,
  addDailyExpiryJob,
  addMinuteCheckJob,
};
