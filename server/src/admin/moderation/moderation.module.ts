import { Module } from '@nestjs/common';
import { ModerationProductsController } from './products/moderation-products.controller';
import { ModerationProductsService } from './products/moderation-products.service';
import { ModerationStoresController } from './stores/moderation-stores.controller';
import { ModerationStoresService } from './stores/moderation-stores.service';

@Module({
  controllers: [ModerationProductsController, ModerationStoresController],
  providers: [ModerationProductsService, ModerationStoresService],
})
export class ModerationModule {}
