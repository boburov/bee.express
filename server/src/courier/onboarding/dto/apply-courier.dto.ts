import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Vehicle types a courier can register with. Kept identical to the courier
 * profile's TransportType (courier/src/features/deliveries/status.ts) so the
 * value seeded into profile.courier on approval matches the profile editor.
 */
export const TRANSPORT_TYPES = [
  'WALK',
  'BICYCLE',
  'MOTORBIKE',
  'CAR',
  'TRUCK',
] as const;
export type TransportType = (typeof TRANSPORT_TYPES)[number];

/**
 * A person's application to become a courier. The applicant has no `courier`
 * role yet — this is the only courier-area endpoint they can reach. On admin
 * approval the role is granted (see ModerationApplicationsService).
 */
export class ApplyCourierDto {
  @IsIn(TRANSPORT_TYPES)
  transportType!: TransportType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  /** READY UploadedFile URLs (passport / driving licence) — optional in v1. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  documentUrls?: string[];
}
