const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("./src/config/db");

//process.env.TZ = "Asia/Kolkata";

const routes = require("./src/routes");

// open mongoose connection
mongoose.connect();

const { Setting } = require("./src/models");

const app = express();
const port = process.env.PORT || 4000;

// Log all requests
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms"),
);

app.enable("trust proxy");

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(bodyParser.json());

app.use("/public", express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  );
  next();
});

// Middleware to set the timezone value in the app.locals object
app.use(async (req, res, next) => {
  const getSetting = await Setting.getgeneral();
  console.log("asdasd", getSetting.general);
  if (getSetting) {
    //app.locals.timezone = getSetting.general.timezone;
    global.DEFAULT_TIMEZONE = getSetting.general.timezone ?? "Asia/Kolkata";
    global.DEFAULT_CURRENCY_CODE = getSetting.general.default_currency;
    global.DEFAULT_DATEFORMAT = getSetting.general.date_format
      ? getSetting.general.date_format
      : "DD MMM YYYY";
    global.DEFAULT_TIMEFORMAT = getSetting.general.time_format
      ? getSetting.general.time_format
      : "hh:mm A";
    global.DEFAULT_CURRENCY = getSetting.general.default_currency;
    global.DEFAULT_APPNAME = getSetting.general.name;
    global.DEFAULT_LOGO = getSetting.general.logo;
    global.DEFAULT_EMAIL = getSetting.general.email;
    global.DEFAULT_ADDRESS = getSetting.general.address;
    global.MAX_DISTANCE = getSetting.app.max_distance
      ? getSetting.app.max_distance
      : 2000;
    global.PREBOOKING_MINUTE = getSetting.app.prebooking_time
      ? getSetting.app.prebooking_time
      : 30;

    global.STARTBOOKING_MINUTE = getSetting.app.startbooking_minute
      ? getSetting.app.startbooking_minute
      : 30;
  }
  next();
});

app.use("/api", routes); // routes api

app.get("/newtest", function (req, res) {
  res.status(200).json({
    message: "welocome from API",
  });
});

const server = app.listen(port, () => {
  let message = `Worker : ${process.pid} started`;
  console.log(`Server running on port ${port}`);
});

process.once("SIGUSR2", () => {
  server.close(() => {
    process.kill(process.pid, "SIGUSR2");
  });
});

module.exports = { app };
