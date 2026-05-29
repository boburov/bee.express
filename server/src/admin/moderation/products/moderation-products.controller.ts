import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { SuperAdminOnly } from '../../../auth/decorators/roles.decorator';
import { RejectModerationDto } from '../dto/reject.dto';
import { ModerationProductsService } from './moderation-products.service';

@Controller('admin/moderation/products')
@SuperAdminOnly()
export class ModerationProductsController {
  constructor(private readonly service: ModerationProductsService) {}

  @Get()
  list(@Query() q: { page?: string; pageSize?: string; q?: string }) {
    return this.service.listPending({
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      q: q.q,
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
