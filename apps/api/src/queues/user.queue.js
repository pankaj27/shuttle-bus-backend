const { Queue } = require("bullmq");
const { connection } = require("../config/redis");

const userQueue = new Queue("user-cleanup", { connection });

// enqueue helper
async function enqueueDeleteUser(payload, opts = {}) {
  const timestamp = Date.now();
  await userQueue.add("delete-user", payload, {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 24 * 60 * 60 * 1000, count: 1000 },
    removeOnFail: { age: 7 * 24 * 60 * 60 * 1000, count: 1000 },
    jobId: `delete-user:${payload.userId}:${timestamp}`,
    priority: 1,
    ...opts,
  });
}

module.exports = { userQueue, enqueueDeleteUser };
