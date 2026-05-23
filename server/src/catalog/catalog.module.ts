import { Module } from '@nestjs/common';
import { AttributeModule } from './attribute/attribute.module';
import { BrandModule } from './brand/brand.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [BrandModule, AttributeModule, CategoryModule],
})
export class CatalogModule {}
