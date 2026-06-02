import { Global, Module } from '@nestjs/common';
import { OtpQueueService } from './otp-queue.service';
import { TelegramQueueService } from './telegram-queue.service';
import { redisProvider } from './redis.provider';

@Global()
@Module({
  providers: [redisProvider, OtpQueueService, TelegramQueueService],
  exports: [OtpQueueService, TelegramQueueService],
})
export class QueueModule {}
