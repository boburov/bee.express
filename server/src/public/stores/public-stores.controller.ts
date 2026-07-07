import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { PublicStoresService } from './public-stores.service';

@Controller('v1/stores')
@Public()
export class PublicStoresController {
  constructor(private readonly stores: PublicStoresService) {}

  @Get()
  list(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('categorySlug') categorySlug?: string,
  ) {
    return this.stores.list({
      lat: lat !== undefined ? Number(lat) : undefined,
      lng: lng !== undefined ? Number(lng) : undefined,
      limit: limit ? Number(limit) : undefined,
      q,
      categorySlug,
    });
  }

  @Get('nearby')
  nearby(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('limit') limit?: string,
  ) {
    if (lat === undefined || lng === undefined) {
      throw new BadRequestException('lat va lng majburiy.');
    }
    return this.stores.nearby({
      lat: Number(lat),
      lng: Number(lng),
      radiusKm: radiusKm ? Number(radiusKm) : 10,
      limit: limit ? Number(limit) : 30,
    });
  }

  @Get('featured')
  featured(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stores.featured({
      lat: lat !== undefined ? Number(lat) : undefined,
      lng: lng !== undefined ? Number(lng) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.stores.getBySlug(slug);
  }

  @Get(':slug/menu')
  menu(
    @Param('slug') slug: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const geo =
      lat !== undefined && lng !== undefined
        ? { lat: Number(lat), lng: Number(lng) }
        : undefined;
    return this.stores.menu(slug, geo);
  }
}
