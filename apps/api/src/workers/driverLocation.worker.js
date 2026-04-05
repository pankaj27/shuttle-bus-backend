// workers/driverLocation.worker.js
const { Worker } = require("bullmq");
const { connection } = require("../config/redis");
const { Driver } = require("../models"); // mongoose model

const concurrency = Number(process.env.CONCURRENCY || 5);
const batchInterval = Number(process.env.LOCATION_BATCH_INTERVAL || 5000); // 5 seconds
let batch = new Map(); // driverId => latest payload

const driverLocationWorker = new Worker(
  "driver-location",
  async (job) => {
    if (job.name !== "driver-location-update") return;

    const payload = job.data;
    // Keep only the latest update per driver
    batch.set(payload.driverId, payload);

    return { ok: true };
  },
  { connection, concurrency },
);

// Periodically flush batch to MongoDB
setInterval(async () => {
  if (batch.size === 0) return;

  const updates = Array.from(batch.values());
  batch.clear(); // reset for next interval

  const bulkOps = updates.map((u) => ({
    updateOne: {
      filter: { _id: u.driverId },
      update: {
        currentLocation: {
          type: "Point",
          coordinates: [parseFloat(u.lng), parseFloat(u.lat)],
          address: u.address,
          angle: u.angle,
        },
        duty_status: u.driver_status,
      },
      upsert: true,
    },
  }));

  try {
    if (bulkOps.length > 0) {
      await Driver.bulkWrite(bulkOps);
      console.log(`✅ Updated ${bulkOps.length} driver locations`);
    }
  } catch (err) {
    console.error("❌ Error updating driver locations:", err);
  }
}, batchInterval);

// Worker event listeners (Reuses existing connection)
driverLocationWorker.on("completed", (job) =>
  console.log(`Job ${job.id} completed`),
);
driverLocationWorker.on("failed", (job, err) =>
  console.error(`Job ${job ? job.id : "unknown"} failed: ${err.message}`),
);

module.exports = { driverLocationWorker };
