import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadPurpose } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Authenticated } from '../auth/types';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { UploadsService } from './uploads.service';

/** Minimal shape of a Multer memory-storage file (avoids the @types/multer dep). */
interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Authenticated for everyone — anyone with a session can upload (avatar,
 * review images, …). Permissions on what to attach the upload to are
 * enforced at the **consumer** (e.g. seller/products checks ownership).
 */
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /**
   * Direct multipart upload — `multipart/form-data` with `file` + `purpose`.
   * One round-trip, returns a READY upload. Works on local disk out of the box;
   * uses R2 when configured. The presign/complete pair below stays for clients
   * that prefer uploading straight to R2.
   */
  @Post('direct')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  direct(
    @UploadedFile() file: MulterFile | undefined,
    @Body('purpose') purpose: string | undefined,
    @CurrentUser() actor: Authenticated,
  ) {
    if (!file) throw new BadRequestException('Fayl yuborilmadi');
    const valid = (Object.values(UploadPurpose) as string[]).includes(purpose ?? '');
    const resolved = (valid ? purpose : UploadPurpose.PRODUCT_IMAGE) as UploadPurpose;
    return this.uploads.directUpload({
      buffer: file.buffer,
      mimeType: file.mimetype,
      size: file.size,
      purpose: resolved,
      uploaderId: actor.id,
    });
  }

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
