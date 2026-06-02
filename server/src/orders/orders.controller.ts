import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Authenticated } from '../auth/types';
import { CheckoutDto } from './dto/checkout.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrderQuoteDto } from './dto/order-quote.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(@Body() dto: OrderQuoteDto, @CurrentUser() actor: Authenticated) {
    return this.orders.quote(dto.addressId, this.requireUser(actor));
  }

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  checkout(@Body() dto: CheckoutDto, @CurrentUser() actor: Authenticated) {
    return this.orders.checkout(dto, this.requireUser(actor));
  }

  @Get()
  list(@Query() query: ListOrdersQueryDto, @CurrentUser() actor: Authenticated) {
    return this.orders.listMine(query, this.requireUser(actor));
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.orders.getMineById(id, this.requireUser(actor));
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string } | undefined,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.orders.cancelMine(id, this.requireUser(actor), body?.reason);
  }

  private requireUser(actor: Authenticated): string {
    if (actor.type !== 'user') {
      throw new ForbiddenException('Faqat foydalanuvchilar buyurtma bera oladi');
    }
    return actor.id;
  }
}
