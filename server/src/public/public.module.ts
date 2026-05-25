import { Module } from '@nestjs/common';
import { PublicCategoriesController } from './categories/public-categories.controller';
import { PublicCategoriesService } from './categories/public-categories.service';
import { PublicProductsController } from './products/public-products.controller';
import { PublicProductsService } from './products/public-products.service';
import { PublicStoresController } from './stores/public-stores.controller';
import { PublicStoresService } from './stores/public-stores.service';

/**
 * Unauthenticated browse — every route here is `@Public()`. Geo params (`lat`,
 * `lng`) gate FOOD listings; MARKETPLACE returns rows regardless.
 */
@Module({
  controllers: [
    PublicCategoriesController,
    PublicProductsController,
    PublicStoresController,
  ],
  providers: [PublicCategoriesService, PublicProductsService, PublicStoresService],
})
export class PublicModule {}
