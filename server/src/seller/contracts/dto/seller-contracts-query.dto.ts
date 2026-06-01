import { CourierContractStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class SellerContractsQueryDto {
  @IsOptional()
  @IsEnum(CourierContractStatus)
  status?: CourierContractStatus;
}
