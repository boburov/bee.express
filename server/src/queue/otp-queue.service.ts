import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import { OTP_SEND_QUEUE, OtpSendJob } from './queue.types';
import { REDIS_CLIENT } from './redis.provider';

@Injectable()
export class OtpQueueService {
  private readonly logger = new Logger(OtpQueueService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async publish(params: {
    telegramId: bigint;
    phone: bigint;
    code: string;
    ttlSeconds: number;
  }): Promise<string> {
    const job: OtpSendJob = {
      telegramId: params.telegramId.toString(),
      phone: params.phone.toString(),
      code: params.code,
      ttlSeconds: params.ttlSeconds,
      requestId: randomUUID(),
      enqueuedAt: Date.now(),
    };
    await this.redis.rpush(OTP_SEND_QUEUE, JSON.stringify(job));
    this.logger.log(`OTP job enqueued: requestId=${job.requestId} phone=${job.phone}`);
    return job.requestId;
  }
}
