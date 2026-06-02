import { Module } from '@nestjs/common';
import { SellerContext } from '../seller-context';
import { SellerStatsController } from './seller-stats.controller';
import { SellerStatsService } from './seller-stats.service';

@Module({
  controllers: [SellerStatsController],
  providers: [SellerStatsService, SellerContext],
})
export class SellerStatsModule {}
