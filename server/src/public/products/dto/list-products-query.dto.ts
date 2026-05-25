import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Filters for the public products list. Geo params are mandatory for FOOD
 * (when `categorySlug` resolves to a FOOD category, controller asserts they
 * are present), and ignored for MARKETPLACE.
 */
export class PublicListProductsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  brandSlug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  // Geo — required for FOOD listings (controller enforces).
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  // Override radius (km). Defaults to category.deliveryRadiusKm.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  radiusKm?: number;

  @IsOptional()
  @IsIn(['price_asc', 'price_desc', 'rating_desc', 'distance_asc', 'newest'])
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'distance_asc' | 'newest';

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(60)
  pageSize?: number;
}
