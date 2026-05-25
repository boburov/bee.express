import { Module } from '@nestjs/common';
import { R2Client } from './r2.client';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  controllers: [UploadsController],
  providers: [R2Client, UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
