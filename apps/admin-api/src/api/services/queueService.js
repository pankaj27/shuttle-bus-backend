const { Queue } = require("bullmq");
const { connection } = require("../../config/redis");

/**
 * Notifications Queue
 */
const notificationQueue = new Queue("notifications", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

module.exports = {
  notificationQueue,
};
