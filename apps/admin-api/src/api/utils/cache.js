const { connection: redis } = require("../../config/redis");
const logger = require("../../config/logger");

/**
 * Get data from Redis Cache
 * @param {string} key
 * @returns {object|null}
 */
const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Redis Get Error [${key}]: ${error.message}`);
    return null;
  }
};

/**
 * Set data in Redis Cache
 * @param {string} key
 * @param {any} data
 * @param {number} ttlSeconds - Default 24 hours (86400s)
 */
const setCache = async (key, data, ttlSeconds = 86400) => {
  try {
    await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
  } catch (error) {
    logger.error(`Redis Set Error [${key}]: ${error.message}`);
  }
};

/**
 * Delete key from Redis Cache
 * @param {string} key
 */
const deleteCache = async (key) => {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error(`Redis Delete Error [${key}]: ${error.message}`);
  }
};

/**
 * Delete keys matching pattern from Redis Cache
 * @param {string} pattern
 */
const invalidateCachePattern = async (pattern) => {
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    stream.on("data", async (keys) => {
      if (keys.length) {
        const pipeline = redis.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }
    });
  } catch (error) {
    logger.error(
      `Redis Invalidate Pattern Error [${pattern}]: ${error.message}`,
    );
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  invalidateCachePattern,
};
