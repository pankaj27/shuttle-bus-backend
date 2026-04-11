const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("./src/config/db");

//process.env.TZ = "Asia/Kolkata";

const routes = require("./src/routes");
const paymentRoute = require("./src/routes/payment");

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
  const general = getSetting && getSetting.general ? getSetting.general : null;
  const appSettings = getSetting && getSetting.app ? getSetting.app : null;
  if (general) {
    //app.locals.timezone = getSetting.general.timezone;
    global.DEFAULT_TIMEZONE = general.timezone ?? "Asia/Kolkata";
    global.DEFAULT_CURRENCY_CODE = general.default_currency;
    global.DEFAULT_DATEFORMAT = general.date_format
      ? general.date_format
      : "DD MMM YYYY";
    global.DEFAULT_TIMEFORMAT = general.time_format
      ? general.time_format
      : "hh:mm A";
    global.DEFAULT_CURRENCY = general.default_currency;
    global.DEFAULT_APPNAME = general.name;
    global.DEFAULT_LOGO = general.logo;
    global.DEFAULT_EMAIL = general.email;
    global.DEFAULT_ADDRESS = general.address;
    global.MAX_DISTANCE =
      appSettings && appSettings.max_distance ? appSettings.max_distance
      : 2000;
    global.PREBOOKING_MINUTE =
      appSettings && appSettings.prebooking_time ? appSettings.prebooking_time
      : 30;

    global.STARTBOOKING_MINUTE =
      appSettings && appSettings.startbooking_minute
      ? appSettings.startbooking_minute
      : 30;
  } else {
    global.DEFAULT_TIMEZONE = global.DEFAULT_TIMEZONE || "Asia/Kolkata";
    global.DEFAULT_DATEFORMAT = global.DEFAULT_DATEFORMAT || "DD MMM YYYY";
    global.DEFAULT_TIMEFORMAT = global.DEFAULT_TIMEFORMAT || "hh:mm A";
  }
  next();
});

app.use("/api", routes); // routes api
app.use("/payments", paymentRoute);

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
