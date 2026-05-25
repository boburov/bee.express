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
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { Authenticated } from '../../auth/types';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { SellerOffersService } from './offers.service';

@Controller('seller/offers')
@Roles('seller')
export class SellerOffersController {
  constructor(private readonly offers: SellerOffersService) {}

  @Get()
  list(@CurrentUser() actor: Authenticated) {
    return this.offers.list(actor.id);
  }

  @Post()
  create(@Body() dto: CreateOfferDto, @CurrentUser() actor: Authenticated) {
    return this.offers.create(dto, actor.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.offers.update(id, dto, actor.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.offers.remove(id, actor.id);
  }
}
