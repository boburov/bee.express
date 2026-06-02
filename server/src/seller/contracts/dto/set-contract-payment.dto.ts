import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { CourierPaymentType } from '@prisma/client';

/** Seller sets how a contracted courier is paid per delivery. */
export class SetContractPaymentDto {
  @IsEnum(CourierPaymentType)
  paymentType!: CourierPaymentType;

  // so'm for SALARY/PER_ORDER, percent (0–100) for PERCENT — capped generously.
  @IsNumber()
  @Min(0)
  @Max(100000000)
  paymentValue!: number;
}
