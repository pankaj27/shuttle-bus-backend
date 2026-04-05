const { Queue } = require("bullmq");
const { connection } = require("../config/redis");

const notificationQueue = new Queue("notification", { connection });

/**
 * Enqueue a notification
 * @param {Object} payload { title, message, data, token }
 */
async function enqueueNotification(payload) {
  payload.timestamp = Date.now();
  await notificationQueue.add("send-notification", payload, {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 24 * 60 * 60 * 1000, count: 10000 },
    removeOnFail: { age: 7 * 24 * 60 * 60 * 1000, count: 10000 },
    jobId: `notification:${payload.token}:${payload.timestamp}`,
    timeout: 30000,
    priority: 1,
  });
}

module.exports = { notificationQueue, enqueueNotification };
