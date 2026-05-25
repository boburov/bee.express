import {
  Body,
  Controller,
  Delete,
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
import { CreateProductDto } from './dto/create-product.dto';
import { ListSellerProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SellerProductsService } from './products.service';

@Controller('seller/products')
@Roles('seller')
export class SellerProductsController {
  constructor(private readonly products: SellerProductsService) {}

  @Get()
  list(@Query() query: ListSellerProductsQueryDto, @CurrentUser() actor: Authenticated) {
    return this.products.list(query, actor.id);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.products.get(id, actor.id);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() actor: Authenticated) {
    return this.products.create(dto, actor.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.products.update(id, dto, actor.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.products.remove(id, actor.id);
  }
}
