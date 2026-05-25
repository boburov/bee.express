import { Module } from '@nestjs/common';
import { UploadsModule } from '../../uploads/uploads.module';
import { SellerContext } from '../seller-context';
import { SellerProductsController } from './products.controller';
import { SellerProductsService } from './products.service';

@Module({
  imports: [UploadsModule],
  controllers: [SellerProductsController],
  providers: [SellerProductsService, SellerContext],
  exports: [SellerProductsService],
})
export class SellerProductsModule {}
