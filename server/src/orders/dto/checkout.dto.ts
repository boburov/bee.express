import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum CheckoutPaymentMethod {
  COD = 'COD',
}

export class CheckoutDto {
  @IsString()
  addressId!: string;

  @IsOptional()
  @IsEnum(CheckoutPaymentMethod)
  paymentMethod?: CheckoutPaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
