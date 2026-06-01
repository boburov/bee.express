import { Module } from '@nestjs/common';
import { AddressesModule } from '../addresses/addresses.module';
import { ContractsModule } from '../contracts/contracts.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AddressesModule, ContractsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
