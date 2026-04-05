const httpStatus = require("http-status");
const { demoMode } = require("../../config/vars");

/**
 * Middleware to restrict state-changing requests in Demo Mode
 */
exports.restrictDemo = (req, res, next) => {
  const skipPaths = [
    "/v1/auth/login",
    "/v1/auth/register",
    "/v1/auth/refresh-token",
    "/v1/auth/send-password-reset",
    "/v1/auth/reset-password",
  ];

  if (
    demoMode &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
    !skipPaths.includes(req.originalUrl.split("?")[0]) &&
    !req.originalUrl.startsWith("/v1/booking-assigns")
  ) {
    return res.status(httpStatus.FORBIDDEN).json({
      message: "Action restricted in Demo Mode.",
      status: false,
      code: httpStatus.FORBIDDEN,
    });
  }
  next();
};
