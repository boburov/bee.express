import { Global, Module } from '@nestjs/common';
import { OtpQueueService } from './otp-queue.service';
import { redisProvider } from './redis.provider';

@Global()
@Module({
  providers: [redisProvider, OtpQueueService],
  exports: [OtpQueueService],
})
export class QueueModule {}
