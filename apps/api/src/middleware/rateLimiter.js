const { connection: redis } = require("../config/redis");

/**
 * Rate limiter for OTP resend
 * Limits to 3 requests per 60 seconds per phone number
 */
const resendOTPRateLimiter = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: false,
        message: "Phone number is required",
      });
    }

    const cooldownKey = `rate_limit:resend_otp:cooldown:${phone}`;
    const dailyKey = `rate_limit:resend_otp:daily:${phone}`;

    const dailyLimit = 10;
    const cooldownSeconds = 60;

    // 1. Check Daily Limit
    const dailyCount = await redis.get(dailyKey);
    if (dailyCount && parseInt(dailyCount) >= dailyLimit) {
      return res.status(429).json({
        status: false,
        message: "Daily resend limit reached. Please try again tomorrow.",
      });
    }

    // 2. Check Cooldown (1 request per minute)
    const isInCooldown = await redis.get(cooldownKey);
    if (isInCooldown) {
      const ttl = await redis.ttl(cooldownKey);
      return res.status(429).json({
        status: false,
        message: `Please wait ${ttl} seconds before requesting another OTP.`,
      });
    }

    // 3. Increment counters
    await redis.set(cooldownKey, "locked", "EX", cooldownSeconds);

    const newDailyCount = await redis.incr(dailyKey);
    if (newDailyCount === 1) {
      // Set expiry for daily key (24 hours)
      await redis.expire(dailyKey, 86400);
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    next();
  }
};

module.exports = { resendOTPRateLimiter };
