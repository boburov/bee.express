import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import { TG_NOTIFY_QUEUE, TgNotifyJob } from './queue.types';
import { REDIS_CLIENT } from './redis.provider';

/**
 * Enqueues a Telegram message for a user (order/notification events). Mirrors
 * OtpQueueService — the bot's telegram-worker BLPOPs and sends. Best-effort:
 * the persisted in-app notification (/notifications/mine) is the source of
 * truth, so a dropped Telegram copy is acceptable.
 */
@Injectable()
export class TelegramQueueService {
  private readonly logger = new Logger(TelegramQueueService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async publish(params: {
    telegramId: bigint;
    text: string;
    link?: string;
    notificationId?: string;
  }): Promise<string> {
    const job: TgNotifyJob = {
      telegramId: params.telegramId.toString(),
      text: params.text,
      link: params.link,
      notificationId: params.notificationId,
      requestId: randomUUID(),
      enqueuedAt: Date.now(),
    };
    await this.redis.rpush(TG_NOTIFY_QUEUE, JSON.stringify(job));
    return job.requestId;
  }
}
