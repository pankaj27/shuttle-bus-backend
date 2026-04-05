const { Worker } = require("bullmq");
const { connection } = require("../config/redis");
const { user } = require("../notifications");

const concurrency = Number(process.env.CONCURRENCY || 5);

const notificationWorker = new Worker(
  "notification",
  async (job) => {
    if (job.name === "send-notification") {
      const { title, message, data, token } = job.data;
      console.log(`🔔 Sending notification to token: ${token}`);

      try {
        const result = await user.UserNotification(title, message, data, token);
        await job.updateProgress(100);
        return result;
      } catch (err) {
        console.error(`❌ Failed to send notification: ${err.message}`);
        throw err;
      }
    }
  },
  { connection, concurrency },
);

// Worker event listeners (Reuses existing connection)
notificationWorker.on("completed", (job) => {
  console.log(`✅ notification job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(
    `❌ notification job ${job ? job.id : "unknown"} failed: ${err.message}`,
  );
});

module.exports = { notificationWorker };
