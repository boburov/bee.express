import { Module } from '@nestjs/common';
import { SellerContext } from '../seller-context';
import { SellerOffersController } from './offers.controller';
import { SellerOffersService } from './offers.service';

@Module({
  controllers: [SellerOffersController],
  providers: [SellerOffersService, SellerContext],
  exports: [SellerOffersService],
})
export class SellerOffersModule {}
