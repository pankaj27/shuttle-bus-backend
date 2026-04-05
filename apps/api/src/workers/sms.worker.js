const { Worker, JobsOptions } = require("bullmq");
const { connection } = require("../config/redis");
const Utils = require("../utils/utils");

const concurrency = Number(process.env.CONCURRENCY || 5);

const smsWorker = new Worker(
  "sms",
  async (job) => {
    if (job.name === "send-sms") {
      const payload = job.data;

      try {
        // Actual SMS sending /phone, otp, templateId
        await Utils.sendSMS(
          payload.phone,
          payload.otp,
          payload.templateId,
          payload.message,
        );

        job.updateProgress(100);
        job.log(`✅ SMS sent to ${payload.mobiles}`);
        return { ok: true };
      } catch (err) {
        job.log(`❌ Failed to send SMS to ${payload.mobiles}: ${err.message}`);
        throw err; // triggers BullMQ retry
      }
    }
  },
  { connection, concurrency },
);

// Worker event listeners (Reuses existing connection)
smsWorker.on("completed", (job) => {
  console.log(`✅ SMS job ${job.id} completed`);
});

smsWorker.on("failed", (job, err) => {
  console.error(
    `❌ SMS job ${job ? job.id : "unknown"} failed: ${err.message}`,
  );
});

module.exports = { smsWorker };
