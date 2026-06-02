import { IsDateString, IsOptional } from 'class-validator';

/** Optional delivered-at date window for the finance summary. */
export class FinanceQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
