import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateProductAttributeDto {
  @IsString()
  attributeId!: string;

  // For SELECT/MULTI attributes — the AttributeValue.id.
  @IsOptional()
  @IsString()
  valueId?: string;

  // For NUMBER/TEXT/BOOL — free-form value as string ("8", "true", …).
  @IsOptional()
  @IsString()
  @MaxLength(200)
  rawValue?: string;
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleRu?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  slug?: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  // Image upload IDs from /uploads/presign + /uploads/:id/complete.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  imageUploadIds?: string[];

  // Optional initial offer — when present, a default variant + SellerOffer is created.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  oldPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  stock?: number;

  // Category-driven attribute values (validated against CategoryAttribute).
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductAttributeDto)
  attributes?: CreateProductAttributeDto[];
}
