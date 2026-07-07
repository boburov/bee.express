import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SuperAdminOnly } from '../../../auth/decorators/roles.decorator';
import { RejectModerationDto } from '../dto/reject.dto';
import { SetFeaturedDto } from './dto/set-featured.dto';
import { ModerationStoresService } from './moderation-stores.service';

@Controller('admin/moderation/stores')
@SuperAdminOnly()
export class ModerationStoresController {
  constructor(private readonly service: ModerationStoresService) {}

  @Get()
  list(@Query() q: { page?: string; pageSize?: string; q?: string }) {
    return this.service.listPending({
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      q: q.q,
    });
  }

  /** ACTIVE stores for the "Top restaurants" curation screen. */
  @Get('active')
  listActive(
    @Query() q: { page?: string; pageSize?: string; q?: string; onlyFeatured?: string },
  ) {
    return this.service.listActive({
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      q: q.q,
      onlyFeatured: q.onlyFeatured === 'true' || q.onlyFeatured === '1',
    });
  }

  @Patch(':id/featured')
  setFeatured(@Param('id') id: string, @Body() dto: SetFeaturedDto) {
    return this.service.setFeatured(id, {
      isFeatured: dto.isFeatured,
      featuredRank: dto.featuredRank,
    });
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(@Param('id') id: string, @Body() dto: RejectModerationDto) {
    return this.service.reject(id, dto.reason);
  }
}
