import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

export type NotificationTargetKind = 'USER' | 'ROLE' | 'BROADCAST';

/**
 * Admin → "send a notification" request.
 *
 * Pick ONE target:
 *   { target: 'USER', userIds: ["..."] }
 *   { target: 'ROLE', roleSlug: "seller" }
 *   { target: 'BROADCAST' }
 */
export class SendNotificationDto {
  @IsIn(['USER', 'ROLE', 'BROADCAST'])
  target!: NotificationTargetKind;

  @ValidateIf((o) => o.target === 'USER')
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  userIds?: string[];

  @ValidateIf((o) => o.target === 'ROLE')
  @IsString()
  roleSlug?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(140)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  /** Arbitrary payload — e.g. `{ link: "/orders/123" }`. */
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

// Type guard helpers (keep import paths clean).
void Type;
