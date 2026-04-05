const Redis = require('ioredis');


const redisHost = process.env.REDIS_HOST || "redis";
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || "";

const connection = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  family: 4, // force IPv4
});

module.exports = { connection };
