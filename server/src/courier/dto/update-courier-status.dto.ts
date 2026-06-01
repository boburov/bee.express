import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '@prisma/client';

/**
 * Courier-driven status moves only. The full enum is intentionally NOT allowed
 * here — the service double-checks against COURIER_TRANSITIONS, but constraining
 * the DTO surfaces a clean 400 for anything off-path.
 *
 *   COURIER_ASSIGNED → ON_WAY      ("Mahsulotni oldim")
 *   ON_WAY           → DELIVERED   ("Yetkazdim")
 */
export class UpdateCourierStatusDto {
  @IsIn([OrderStatus.ON_WAY, OrderStatus.DELIVERED])
  status!: typeof OrderStatus.ON_WAY | typeof OrderStatus.DELIVERED;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
