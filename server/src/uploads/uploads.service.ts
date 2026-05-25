import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { UploadedFile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { R2Client } from './r2.client';
import { UPLOAD_POLICIES, extensionFor } from './uploads.config';

export interface PresignResult {
  uploadId: string;
  key: string;
  /** Pre-signed PUT URL — client uploads body directly to R2. */
  putUrl: string;
  /** Headers the client MUST attach to its PUT request. */
  headers: Record<string, string>;
  expiresInSeconds: number;
}

export interface CompletedUpload {
  id: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2Client,
  ) {}

  async presign(dto: PresignUploadDto, uploaderId: string): Promise<PresignResult> {
    if (!this.r2.configured) {
      throw new ServiceUnavailableException(
        'Fayl yuklash xizmati hozircha sozlanmagan (R2). Adminga murojaat qiling.',
      );
    }

    const policy = UPLOAD_POLICIES[dto.purpose];
    if (!policy.mimes.includes(dto.mimeType)) {
      throw new BadRequestException(
        `Ruxsat etilmagan fayl turi. Qabul qilinadi: ${policy.mimes.join(', ')}`,
      );
    }
    if (dto.size > policy.maxBytes) {
      throw new BadRequestException(
        `Fayl juda katta. Maksimal: ${(policy.maxBytes / (1024 * 1024)).toFixed(0)} MB`,
      );
    }

    // 24-char random + extension. Cuid would also work but we keep keys URL-safe and short.
    const random = randomBytes(12).toString('hex');
    const key = `${policy.prefix}/${random}.${extensionFor(dto.mimeType)}`;

    const expiresInSeconds = 5 * 60;
    const putUrl = await this.r2.signPutUrl({
      key,
      mimeType: dto.mimeType,
      maxBytes: dto.size,
      expiresInSeconds,
    });

    const record = await this.prisma.uploadedFile.create({
      data: {
        key,
        mimeType: dto.mimeType,
        size: dto.size,
        status: 'PENDING',
        purpose: dto.purpose,
        uploaderId,
      },
    });

    return {
      uploadId: record.id,
      key,
      putUrl,
      headers: {
        'Content-Type': dto.mimeType,
        'Content-Length': String(dto.size),
      },
      expiresInSeconds,
    };
  }

  async complete(id: string, uploaderId: string): Promise<CompletedUpload> {
    if (!this.r2.configured) {
      throw new ServiceUnavailableException('Upload xizmati sozlanmagan.');
    }

    const row = await this.prisma.uploadedFile.findUnique({ where: { id } });
    if (!row || row.uploaderId !== uploaderId) {
      throw new NotFoundException('Yuklov topilmadi');
    }
    if (row.status === 'READY') {
      return this.serialize(row);
    }

    const head = await this.r2.headObject(row.key);
    if (!head) {
      throw new BadRequestException(
        "Fayl R2 da topilmadi. Avval pre-signed URL ga PUT qiling.",
      );
    }

    // Re-verify against the declared mime/size — the client might lie.
    const updated = await this.prisma.uploadedFile.update({
      where: { id },
      data: {
        status: 'READY',
        readyAt: new Date(),
        size: head.size,
        mimeType: head.mimeType,
        url: this.r2.publicUrlFor(row.key),
      },
    });
    return this.serialize(updated);
  }

  async getReadyOrThrow(uploadId: string, uploaderId: string): Promise<UploadedFile> {
    const row = await this.prisma.uploadedFile.findUnique({ where: { id: uploadId } });
    if (!row || row.uploaderId !== uploaderId) {
      throw new NotFoundException('Upload topilmadi');
    }
    if (row.status !== 'READY' || !row.url) {
      throw new BadRequestException(
        'Fayl hali yuklanmagan. Avval /uploads/:id/complete chaqiring.',
      );
    }
    return row;
  }

  /** Link an existing READY upload to an entity (called by Products / Stores services). */
  async attach(uploadId: string, entityType: string, entityId: string): Promise<void> {
    await this.prisma.uploadedFile.update({
      where: { id: uploadId },
      data: { entityType, entityId },
    });
  }

  private serialize(row: UploadedFile): CompletedUpload {
    return {
      id: row.id,
      key: row.key,
      url: row.url ?? '',
      mimeType: row.mimeType,
      size: row.size,
    };
  }
}
