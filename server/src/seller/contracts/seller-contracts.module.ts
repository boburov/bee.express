import { Module } from '@nestjs/common';
import { ContractsModule } from '../../contracts/contracts.module';
import { SellerContext } from '../seller-context';
import { SellerContractsController } from './seller-contracts.controller';

@Module({
  imports: [ContractsModule],
  controllers: [SellerContractsController],
  providers: [SellerContext],
})
export class SellerContractsModule {}
