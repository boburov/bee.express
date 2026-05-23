import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Redis => {
    const logger = new Logger('Redis');
    const url = config.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379';
    const client = new Redis(url, { lazyConnect: false, maxRetriesPerRequest: null });
    client.on('connect', () => logger.log(`Connected to ${url}`));
    client.on('error', (err) => logger.error(`Redis error: ${err.message}`));
    return client;
  },
};
