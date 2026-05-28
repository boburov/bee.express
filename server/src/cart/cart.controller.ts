import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Authenticated } from '../auth/types';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  getMine(@CurrentUser() actor: Authenticated) {
    return this.cart.getMine(this.requireUser(actor));
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  addItem(@Body() dto: AddCartItemDto, @CurrentUser() actor: Authenticated) {
    return this.cart.addItem(dto, this.requireUser(actor));
  }

  @Patch('items/:id')
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.cart.updateItem(id, dto, this.requireUser(actor));
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  removeItem(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.cart.removeItem(id, this.requireUser(actor));
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  clear(@CurrentUser() actor: Authenticated) {
    return this.cart.clear(this.requireUser(actor));
  }

  private requireUser(actor: Authenticated): string {
    if (actor.type !== 'user') {
      throw new ForbiddenException('Faqat foydalanuvchilar savatga ega bo\'la oladi');
    }
    return actor.id;
  }
}
