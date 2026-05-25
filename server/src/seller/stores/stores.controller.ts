import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { Authenticated } from '../../auth/types';
import { CreateStoreDto } from './dto/create-store.dto';
import { ToggleOpenDto } from './dto/toggle-open.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@Controller('seller/stores')
@Roles('seller')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get('me')
  getMine(@CurrentUser() actor: Authenticated) {
    return this.stores.getMine(actor.id);
  }

  @Post()
  create(@Body() dto: CreateStoreDto, @CurrentUser() actor: Authenticated) {
    return this.stores.create(dto, actor.id);
  }

  @Patch('me')
  updateMine(@Body() dto: UpdateStoreDto, @CurrentUser() actor: Authenticated) {
    return this.stores.updateMine(dto, actor.id);
  }

  @Patch('me/open')
  @HttpCode(HttpStatus.OK)
  toggleOpen(@Body() dto: ToggleOpenDto, @CurrentUser() actor: Authenticated) {
    return this.stores.toggleOpen(dto.isOpen, actor.id);
  }
}
