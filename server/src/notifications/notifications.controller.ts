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
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SuperAdminOnly } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Authenticated } from '../auth/types';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationsService } from './notifications.service';

/**
 * Two surfaces:
 *   /admin/notifications  → super-admin only (send + history)
 *   /notifications        → recipient surface (list, mark read)
 */
@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // ───── Admin: send + history ─────

  @SuperAdminOnly()
  @Post('admin/notifications')
  send(@Body() dto: SendNotificationDto, @CurrentUser() actor: Authenticated) {
    return this.notifications.send(dto, {
      type: 'SUPER_ADMIN',
      id: actor.id,
    });
  }

  @SuperAdminOnly()
  @Get('admin/notifications')
  history(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.notifications.listGroups({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  // ───── Recipient: list + mark-read ─────

  @UseGuards(JwtAuthGuard)
  @Get('notifications/mine')
  listMine(
    @Query() query: ListNotificationsQueryDto,
    @CurrentUser() actor: Authenticated,
  ) {
    // SuperAdmin doesn't have personal notifications in v1.
    if (actor.type === 'super_admin') {
      return { items: [], total: 0, unread: 0, page: 1, pageSize: 0 };
    }
    return this.notifications.listMine(actor.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('notifications/unread-count')
  unreadCount(@CurrentUser() actor: Authenticated) {
    if (actor.type === 'super_admin') return { count: 0 };
    return this.notifications.unreadCount(actor.id).then((count) => ({ count }));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notifications/:id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    if (actor.type === 'super_admin') return { ok: true };
    return this.notifications.markRead(id, actor.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('notifications/read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() actor: Authenticated) {
    if (actor.type === 'super_admin') return { updated: 0 };
    return this.notifications.markAllRead(actor.id);
  }
}
