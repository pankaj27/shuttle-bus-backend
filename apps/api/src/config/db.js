const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
const env = process.env.NODE_ENV;
// print mongoose logs in dev env
if (env === "development") {
  mongoose.set("debug", true);
}

mongoose.set("strictQuery", true);
/**
 * Connect to mongo db
 *
 * @returns {object} Mongoose connection
 * @public
 */

exports.connect = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGO_DB_LOCAL ||
      (process.env.MONGO_HOST && process.env.MONGO_DB
        ? `mongodb+srv://${process.env.MONGO_USERNAME}:${encodeURIComponent(
            process.env.MONGO_PASSWORD || "",
          )}@${process.env.MONGO_HOST}/${process.env.MONGO_DB}?authSource=admin${
            process.env.MONGO_RS ? `&replicaSet=${process.env.MONGO_RS}` : ""
          }`
        : null);

    if (!mongoUri) {
      throw new Error(
        "Missing MongoDB connection string. Set MONGO_URI (recommended) or MONGO_DB_LOCAL or (MONGO_HOST + MONGO_DB).",
      );
    }

    await mongoose.connect(mongoUri, { autoIndex: false });

    console.log("MongoDB connected...");

    try {
      await mongoose.connection.collection("locations").createIndex({ location: "2dsphere" });
    } catch (indexErr) {
      console.error("Failed to ensure 2dsphere index on locations.location", indexErr);
    }

    try {
      const payments = mongoose.connection.collection("payments");
      await payments.createIndex({ orderId: 1 });
      await payments.createIndex({ ferriOrderId: 1 });
      await payments.createIndex({ bookingLogId: 1 });
      await payments.createIndex({ payment_status: 1 });
    } catch (indexErr) {
      console.error("Failed to ensure indexes on payments", indexErr);
    }

    try {
      const bookingLogs = mongoose.connection.collection("booking_logs");
      await bookingLogs.createIndex({ userId: 1, createdAt: -1 });
      await bookingLogs.createIndex({ busScheduleId: 1 });
      await bookingLogs.createIndex({ routeId: 1 });
      await bookingLogs.createIndex({ booking_date: 1 });
    } catch (indexErr) {
      console.error("Failed to ensure indexes on booking_logs", indexErr);
    }
  } catch (err) {
    console.error("MongoDB initial connection failed", err);
    process.exit(1); // 🔴 triggers Docker restart
  }

  /**
   * Runtime error handling
   */
  mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected");
    process.exit(1);
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB runtime error", err);
    process.exit(1);
  });

  /**
   * Graceful shutdown
   */
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    process.exit(0);
  });

  return mongoose.connection;
};
