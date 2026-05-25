import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { OfferCondition } from '@prisma/client';

export class CreateOfferDto {
  @IsString()
  variantId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  oldPrice?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stock!: number;

  @IsOptional()
  @IsEnum(OfferCondition)
  condition?: OfferCondition;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  deliveryDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
