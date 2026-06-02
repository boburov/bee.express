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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { Authenticated } from '../../auth/types';
import { AssignCourierDto } from '../../orders/dto/assign-courier.dto';
import { ListOrdersQueryDto } from '../../orders/dto/list-orders-query.dto';
import { UpdateOrderStatusDto } from '../../orders/dto/update-status.dto';
import { OrdersService } from '../../orders/orders.service';
import { SellerContext } from '../seller-context';

@Controller('seller/orders')
@Roles('seller')
export class SellerOrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly ctx: SellerContext,
  ) {}

  @Get()
  async list(@Query() query: ListOrdersQueryDto, @CurrentUser() actor: Authenticated) {
    const store = await this.ctx.requireOwnStore(actor.id);
    return this.orders.listForStore(store.id, query);
  }

  @Get(':id')
  async detail(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    const store = await this.ctx.requireOwnStore(actor.id);
    return this.orders.getForStore(id, store.id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() actor: Authenticated,
  ) {
    const store = await this.ctx.requireOwnStore(actor.id);
    return this.orders.updateStatusForStore(id, store.id, actor.id, dto);
  }

  @Post(':id/assign-courier')
  @HttpCode(HttpStatus.OK)
  async assignCourier(
    @Param('id') id: string,
    @Body() dto: AssignCourierDto,
    @CurrentUser() actor: Authenticated,
  ) {
    const store = await this.ctx.requireOwnStore(actor.id);
    return this.orders.assignCourierForStore(id, store.id, actor.id, dto.courierId);
  }
}
