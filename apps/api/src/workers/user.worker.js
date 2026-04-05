const { Worker } = require("bullmq");
const { connection } = require("../config/redis");
const { User } = require("../models");

const concurrency = Number(process.env.CONCURRENCY || 5);

const userWorker = new Worker(
  "user-cleanup",
  async (job) => {
    if (job.name === "delete-user") {
      const { userId } = job.data;
      console.log(`🗑️ Processing permanent delete for user: ${userId}`);

      try {
        const result = await User.deleteOne({ _id: userId });
        console.log(result);
        job.log(
          result.deletedCount === 1
            ? `✅ User ${userId} and all associated data permanently deleted. Stats: ${JSON.stringify(result.stats)}`
            : `⚠️ User ${userId} not found.`,
        );

        await job.updateProgress(100);
        return result;
      } catch (err) {
        job.log(
          `❌ Failed to process permanent delete for user ${userId}: ${err.message}`,
        );
        throw err;
      }
    }
  },
  { connection, concurrency },
);

// Worker event listeners (Reuses existing connection)
userWorker.on("completed", (job) => {
  console.log(`✅ User cleanup job ${job.id} completed`);
});

userWorker.on("failed", (job, err) => {
  console.error(
    `❌ User cleanup job ${job ? job.id : "unknown"} failed: ${err.message}`,
  );
});

module.exports = { userWorker };
