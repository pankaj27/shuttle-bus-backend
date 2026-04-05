const { Queue } = require("bullmq");
const { connection } = require("../config/redis");

const driverLocationQueue = new Queue("driver-location", { connection });

// enqueue helper
async function enqueueDriverLocation(payload) {
  payload.timestamp = Date.now(); // add timestamp to payload
  await driverLocationQueue.add("driver-location-update", payload, {
    attempts: 3, // retries
    backoff: { type: "exponential", delay: 1000 }, // 1s, 2s, 4s, ...
    removeOnComplete: true, 
    removeOnFail: 1000,
    jobId: `driverLocation:${payload.driverId}:${payload.timestamp}`,
  });
}

module.exports = { driverLocationQueue, enqueueDriverLocation };
