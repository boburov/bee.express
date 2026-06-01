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
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { SuperAdminOnly } from '../../../auth/decorators/roles.decorator';
import type { Authenticated } from '../../../auth/types';
import { RejectModerationDto } from '../dto/reject.dto';
import { ModerationApplicationsService } from './moderation-applications.service';

@Controller('admin/moderation/courier-applications')
@SuperAdminOnly()
export class ModerationApplicationsController {
  constructor(private readonly service: ModerationApplicationsService) {}

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
  approve(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.service.approve(id, actor.id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectModerationDto,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.service.reject(id, dto.reason, actor.id);
  }
}
