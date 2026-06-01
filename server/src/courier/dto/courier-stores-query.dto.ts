import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination-query.dto';

/**
 * Courier browses ACTIVE stores to contract with. Geo is optional: when
 * lat/lng are present we bounding-box prefilter + haversine-sort by pickup
 * distance; otherwise we list alphabetically. `q` filters by store name.
 */
export class CourierStoresQueryDto extends PaginationQueryDto {
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
  @Min(1)
  @Max(100)
  radiusKm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
