// import .env variables
require("dotenv-safe").config({
  allowEmptyValues: true,
});

const mongoose = require("../../config/mongoose"); // your mongoose connection helper
const { notificationWorker } = require("./notification.worker");

(async () => {
  try {
    // 1️⃣ Connect to MongoDB first
    await mongoose.connect();

    // 2️⃣ Load Global Settings
    const Setting = require("../models/setting.model");
    const getSetting = await Setting.getgeneral();
    if (getSetting) {
      global.DEFAULT_TIMEZONE = getSetting.timezone ?? "Asia/Kolkata";
      global.DEFAULT_DATEFORMAT = getSetting.date_format ?? "DD MMM YYYY";
      global.DEFAULT_TIMEFORMAT = getSetting.time_format ?? "hh:mm A";
      global.DEFAULT_CURRENCY = getSetting.default_currency ?? "INR";
      console.log("✅ Global settings loaded for worker.");
    }

    // 3️⃣ Start workers
    console.log("📡 All workers started...");

    // 3️⃣ Global error handling
    notificationWorker.on("error", (err) => {
      console.error(`Worker error:`, err);
    });
  } catch (err) {
    console.error("❌ Failed to start workers:", err);
    process.exit(1);
  }
})();
