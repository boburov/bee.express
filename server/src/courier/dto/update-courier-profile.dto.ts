import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Vehicle types from TZ §6.3 (piyoda / velosiped / mototsikl / mashina / yuk). */
export const TRANSPORT_TYPES = [
  'WALK',
  'BICYCLE',
  'MOTORBIKE',
  'CAR',
  'TRUCK',
] as const;
export type TransportType = (typeof TRANSPORT_TYPES)[number];

/**
 * Partial update of the courier's working profile. Everything lives under
 * `User.profile.courier` (Json) — no rigid per-role table, per the schema's
 * "fully dynamic" note. `firstName`/`lastName` write straight onto the User.
 */
export class UpdateCourierProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsOptional()
  @IsIn(TRANSPORT_TYPES)
  transportType?: TransportType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  workRadiusKm?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}
