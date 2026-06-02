import { IsString } from 'class-validator';

/** Pre-checkout deliverability/fee preview against a chosen address. */
export class OrderQuoteDto {
  @IsString()
  addressId!: string;
}
