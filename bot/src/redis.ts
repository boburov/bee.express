import Redis from "ioredis";
import { config } from "./config";

/**
 * Two separate connections: the worker needs a dedicated blocking client for
 * BLPOP because ioredis serializes commands per connection.
 */
export const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
export const blockingRedis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
