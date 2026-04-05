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
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });

    console.log("MongoDB connected...");
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
