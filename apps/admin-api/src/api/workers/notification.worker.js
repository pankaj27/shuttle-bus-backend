const { Worker } = require("bullmq");
const { connection } = require("../../config/redis");

connection.on("error", (err) => {
  console.error("Redis connection error:", err);
});
connection.on("ready", () => {
  console.log("Redis connection ready for worker.");
});
const firebaseUser = require("../services/firebaseUser");
const ScheduledNotification = require("../models/scheduledNotification.model");

const concurrency = Number(process.env.CONCURRENCY || 5);

const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    const { type, payload } = job.data;
    console.log(`[Worker] Processing job ${job.id}:`, type);

    console.log("Sending single notification to token: ", payload);

    try {
      if (
        !firebaseUser.sendSingleMessage ||
        !firebaseUser.sendMulticastNotification
      ) {
        throw new Error(
          "Firebase service not properly initialized or exported.",
        );
      }

      if (type === "single") {
        await firebaseUser.sendSingleMessage(payload);
        job.log(`✅ Single notification sent to token: ${payload.token}`);
      } else if (type === "multicast") {
        const result = await firebaseUser.sendMulticastNotification(payload);
        job.log(
          `✅ Multicast notification sent. Success: ${result ? result.successCount : "N/A"}, Failure: ${result ? result.failureCount : "N/A"}`,
        );

        // Update ScheduledNotification stats if scheduleId is present
        if (job.data.scheduleId && result) {
          await ScheduledNotification.updateOne(
            { _id: job.data.scheduleId },
            {
              $inc: {
                "send_total.success_count": result.successCount,
                "send_total.failed_count": result.failureCount,
              },
            },
          );
        }

        return result;
      }

      job.updateProgress(100);
      return { ok: true };
    } catch (err) {
      job.log(`❌ Failed to send notification: ${err.message}`);
      throw err; // triggers BullMQ retry
    }
  },
  { connection, concurrency },
);

// Worker event listeners (Avoids needing a separate Redis connection for QueueEvents)
notificationWorker.on("completed", (job) => {
  console.log(`✅ notification job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(
    `❌ notification job ${job ? job.id : "unknown"} failed: ${err.message}`,
  );
});

module.exports = { notificationWorker };
