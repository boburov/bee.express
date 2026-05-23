import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AttributeType } from '@prisma/client';

export class CreateAttributeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nameRu?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @IsEnum(AttributeType)
  type!: AttributeType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;
}
