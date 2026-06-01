import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestContractDto {
  @IsString()
  @MinLength(1)
  storeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
