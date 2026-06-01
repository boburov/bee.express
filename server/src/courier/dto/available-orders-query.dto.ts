import { Type } from 'class-transformer';
import { IsInt, IsLatitude, IsLongitude, IsOptional, Max, Min } from 'class-validator';

/**
 * The courier's current location + work radius. When lat/lng are present we
 * bounding-box prefilter store geo, then haversine-refine to `radiusKm`. When
 * absent we return the whole READY pool unfiltered (newest first).
 */
export class AvailableOrdersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  radiusKm?: number;
}
