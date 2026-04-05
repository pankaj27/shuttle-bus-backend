// make bluebird default Promise
/* eslint-disable */
const { port, env } = require("./config/vars");
const logger = require("./config/logger");
const mongoose = require("./config/mongoose");
const app = require("./config/express");

const schedule = require("./api/services/schedule");

// open mongoose connection
mongoose.connect();

schedule.reSchedule();

// listen to requests
const server = app.listen(port, () =>
  logger.info(`server started on port ${port} (${env})`),
);

process.once("SIGUSR2", () => {
  server.close(() => {
    process.kill(process.pid, "SIGUSR2");
  });
});

/**
 * Exports express
 * @public
 */
module.exports = app;
// touch
