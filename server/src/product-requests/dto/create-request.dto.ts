import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductRequestDto {
  @IsString()
  productId!: string;

  // Optional — when buyer specifies a particular seller they want restock from.
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
