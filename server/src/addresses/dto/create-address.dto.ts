import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  fullText!: string;

  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'boolean' ? value : value === 'true'))
  @IsBoolean()
  isDefault?: boolean;
}
