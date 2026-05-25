import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SuperAdminOnly } from '../../auth/decorators/roles.decorator';
import type { Authenticated } from '../../auth/types';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('admin/roles')
@SuperAdminOnly()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  list() {
    return this.roles.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.roles.get(id);
  }

  @Post()
  create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() actor: Authenticated,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.roles.create(dto, {
      actorId: actor.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: Authenticated,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.roles.update(id, dto, {
      actorId: actor.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @CurrentUser() actor: Authenticated,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.roles.remove(id, {
      actorId: actor.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
