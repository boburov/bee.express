import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Authenticated } from '../auth/types';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { UploadsService } from './uploads.service';

/**
 * Authenticated for everyone — anyone with a session can upload (avatar,
 * review images, …). Permissions on what to attach the upload to are
 * enforced at the **consumer** (e.g. seller/products checks ownership).
 */
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  presign(@Body() dto: PresignUploadDto, @CurrentUser() actor: Authenticated) {
    return this.uploads.presign(dto, actor.id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.uploads.complete(id, actor.id);
  }
}
