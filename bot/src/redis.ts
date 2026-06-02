import Redis from "ioredis";
import { config } from "./config";

/**
 * Two separate connections: the worker needs a dedicated blocking client for
 * BLPOP because ioredis serializes commands per connection.
 */
export const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
export const blockingRedis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
// Dedicated blocking client for the Telegram-notify worker — ioredis serializes
// commands per connection, so it must not share blockingRedis with the OTP worker.
export const tgBlockingRedis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
