import { Module } from '@nestjs/common';
import { SellerContractsModule } from './contracts/seller-contracts.module';
import { SellerFinanceModule } from './finance/seller-finance.module';
import { SellerOffersModule } from './offers/offers.module';
import { SellerOrdersModule } from './orders/seller-orders.module';
import { SellerProductsModule } from './products/products.module';
import { StoresModule } from './stores/stores.module';

/** Aggregates every seller-scoped module under `/api/seller/...`. */
@Module({
  imports: [
    StoresModule,
    SellerProductsModule,
    SellerOffersModule,
    SellerOrdersModule,
    SellerContractsModule,
    SellerFinanceModule,
  ],
})
export class SellerModule {}
