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
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() actor: Authenticated) {
    return this.addresses.list(this.requireUser(actor));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAddressDto, @CurrentUser() actor: Authenticated) {
    return this.addresses.create(dto, this.requireUser(actor));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.addresses.update(id, dto, this.requireUser(actor));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    return this.addresses.remove(id, this.requireUser(actor));
  }

  private requireUser(actor: Authenticated): string {
    if (actor.type !== 'user') {
      throw new ForbiddenException('Faqat foydalanuvchilar manzilga ega bo\'la oladi');
    }
    return actor.id;
  }
}
