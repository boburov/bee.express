import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import { UploadPurpose } from '@prisma/client';

export class PresignUploadDto {
  @IsEnum(UploadPurpose)
  purpose!: UploadPurpose;

  @IsString()
  mimeType!: string;

  /** Declared size in bytes. Server still re-checks via HEAD after upload. */
  @IsInt()
  @Min(1)
  @Max(50 * 1024 * 1024)
  size!: number;
}
