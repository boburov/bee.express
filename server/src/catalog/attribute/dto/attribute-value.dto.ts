import { IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateAttributeValueDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'hexColor #RRGGBB formatda bo\'lishi kerak' })
  hexColor?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateAttributeValueDto extends PartialType(CreateAttributeValueDto) {}
