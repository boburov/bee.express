import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Authenticated } from '../auth/types';
import { CourierService } from './courier.service';
import { AvailableOrdersQueryDto } from './dto/available-orders-query.dto';
import { CourierOrdersQueryDto } from './dto/courier-orders-query.dto';
import { UpdateCourierProfileDto } from './dto/update-courier-profile.dto';
import { UpdateCourierStatusDto } from './dto/update-courier-status.dto';

/**
 * Courier Mini App API (TZ §21). Every route is gated to the `courier` role;
 * SuperAdmin bypasses via RolesGuard. The courier's id is taken from the JWT,
 * never the URL, so one courier can't read or mutate another's runs.
 */
@Controller('courier')
@Roles('courier')
export class CourierController {
  constructor(private readonly courier: CourierService) {}

  // ─── Available pool ─────────────────────────────────────────────────

  @Get('available')
  available(@Query() query: AvailableOrdersQueryDto, @CurrentUser() actor: Authenticated) {
    return this.courier.listAvailable(query, this.requireCourier(actor));
  }

  @Post('orders/:id/accept')
  @HttpCode(HttpStatus.OK)
  accept(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.courier.accept(id, this.requireCourier(actor));
  }

  // ─── Own orders ─────────────────────────────────────────────────────

  @Get('orders')
  listMine(@Query() query: CourierOrdersQueryDto, @CurrentUser() actor: Authenticated) {
    return this.courier.listMine(query, this.requireCourier(actor));
  }

  @Get('orders/:id')
  detail(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.courier.getMine(id, this.requireCourier(actor));
  }

  @Patch('orders/:id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCourierStatusDto,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.courier.updateStatus(id, this.requireCourier(actor), dto);
  }

  @Post('orders/:id/release')
  @HttpCode(HttpStatus.OK)
  release(
    @Param('id') id: string,
    @Body() body: { reason?: string } | undefined,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.courier.release(id, this.requireCourier(actor), body?.reason);
  }

  // ─── Dashboard / profile ────────────────────────────────────────────

  @Get('stats')
  stats(@CurrentUser() actor: Authenticated) {
    return this.courier.stats(this.requireCourier(actor));
  }

  @Get('profile')
  profile(@CurrentUser() actor: Authenticated) {
    return this.courier.getProfile(this.requireCourier(actor));
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @Body() dto: UpdateCourierProfileDto,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.courier.updateProfile(this.requireCourier(actor), dto);
  }

  /** Guards against a SuperAdmin (who bypasses RolesGuard) hitting courier routes. */
  private requireCourier(actor: Authenticated): string {
    if (actor.type !== 'user') {
      throw new ForbiddenException('Faqat kuryerlar uchun');
    }
    return actor.id;
  }
}
