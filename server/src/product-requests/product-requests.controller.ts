import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Authenticated } from '../auth/types';
import { CreateProductRequestDto } from './dto/create-request.dto';
import { ProductRequestsService } from './product-requests.service';

@Controller()
export class ProductRequestsController {
  constructor(private readonly requests: ProductRequestsService) {}

  // Buyer endpoints — any authenticated user.
  @UseGuards(JwtAuthGuard)
  @Post('product-requests')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductRequestDto, @CurrentUser() actor: Authenticated) {
    return this.requests.create(dto, actor.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('product-requests/mine')
  listMine(@CurrentUser() actor: Authenticated) {
    return this.requests.listMine(actor.id);
  }

  // Seller endpoint — incoming pings the seller can act on.
  @Roles('seller')
  @Get('seller/product-requests')
  listForSeller(@CurrentUser() actor: Authenticated) {
    return this.requests.listForSeller(actor.id);
  }

  @Roles('seller')
  @Post('seller/product-requests/:id/fulfilled')
  @HttpCode(HttpStatus.OK)
  markFulfilled(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.requests.markFulfilled(id, actor.id);
  }
}
