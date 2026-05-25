import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  productId!: string;

  @IsString()
  storeId!: string;

  // Will become MANDATORY once the orders module ships — placeholder until then.
  @IsOptional()
  @IsString()
  orderId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  text?: string;

  // Upload IDs (REVIEW_IMAGE purpose). Capped at 5.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  imageUploadIds?: string[];
}
