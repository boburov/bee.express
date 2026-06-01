import { CourierContractStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class CourierContractsQueryDto {
  @IsOptional()
  @IsEnum(CourierContractStatus)
  status?: CourierContractStatus;
}
