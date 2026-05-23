import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
