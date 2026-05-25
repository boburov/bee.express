import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { PublicListProductsQueryDto } from './dto/list-products-query.dto';
import { PublicProductsService } from './public-products.service';

@Controller('v1/products')
@Public()
export class PublicProductsController {
  constructor(private readonly products: PublicProductsService) {}

  @Get()
  list(@Query() query: PublicListProductsQueryDto) {
    return this.products.list(query);
  }

  @Get(':slug')
  getBySlug(
    @Param('slug') slug: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const geo =
      lat !== undefined && lng !== undefined
        ? { lat: Number(lat), lng: Number(lng) }
        : undefined;
    return this.products.getBySlug(slug, geo);
  }
}
