import { Module } from '@nestjs/common';
import { SellerContext } from '../seller-context';
import { SellerFinanceController } from './seller-finance.controller';
import { SellerFinanceService } from './seller-finance.service';

@Module({
  controllers: [SellerFinanceController],
  providers: [SellerFinanceService, SellerContext],
})
export class SellerFinanceModule {}
