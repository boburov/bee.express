import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SuperAdminOnly } from '../../auth/decorators/roles.decorator';
import type { Authenticated } from '../../auth/types';
import { AssignRoleDto } from './dto/assign-role.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersService } from './users.service';

@Controller('admin/users')
@SuperAdminOnly()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.users.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.get(id);
  }

  @Patch(':id/block')
  @HttpCode(HttpStatus.OK)
  block(
    @Param('id') id: string,
    @Body() dto: BlockUserDto,
    @CurrentUser() actor: Authenticated,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.users.block(id, dto, {
      actorId: actor.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Patch(':id/unblock')
  @HttpCode(HttpStatus.OK)
  unblock(
    @Param('id') id: string,
    @CurrentUser() actor: Authenticated,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.users.unblock(id, {
      actorId: actor.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() actor: Authenticated,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.users.assignRole(id, dto, {
      actorId: actor.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
