import { Module } from '@nestjs/common';
import { OrdersModule } from '../../orders/orders.module';
import { SellerContext } from '../seller-context';
import { SellerOrdersController } from './seller-orders.controller';

@Module({
  imports: [OrdersModule],
  controllers: [SellerOrdersController],
  providers: [SellerContext],
})
export class SellerOrdersModule {}
