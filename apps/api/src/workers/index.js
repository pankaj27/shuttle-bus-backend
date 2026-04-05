require("dotenv").config();
const mongoose = require("../config/db"); // your mongoose connection helper
const { smsWorker } = require("./sms.worker");
const { driverLocationWorker } = require("./driverLocation.worker");
const { userWorker } = require("./user.worker");
const { notificationWorker } = require("./notification.worker");
const { tripWorker } = require("./trip.worker");
const {
  addDailyResetJob,
  addDailyExpiryJob,
  addMinuteCheckJob,
} = require("../queues/trip.queue");

(async () => {
  try {
    // 1️⃣ Connect to MongoDB first
    await mongoose.connect();

    // 2️⃣ Start workers
    console.log("📡 All workers started...");

    // 3️⃣ Initialize repeatable jobs
    await addDailyResetJob();
    await addDailyExpiryJob();
    await addMinuteCheckJob();

    // 4️⃣ Global error handling
    [
      smsWorker,
      driverLocationWorker,
      userWorker,
      notificationWorker,
      tripWorker,
    ].forEach((worker) => {
      worker.on("error", (err) => {
        console.error(`Worker ${worker.name || "unknown"} error:`, err);
      });

      worker.on("completed", (job) => {
        console.log(
          `✅ Worker ${worker.name || "unknown"} job ${job.id} completed`,
        );
      });

      worker.on("failed", (job, failedReason) => {
        console.error(
          `❌ Worker ${worker.name || "unknown"} job ${job ? job.id : "unknown"} failed:`,
          failedReason,
        );
      });
    });
  } catch (err) {
    console.error("❌ Failed to start workers:", err);
    process.exit(1);
  }
})();
