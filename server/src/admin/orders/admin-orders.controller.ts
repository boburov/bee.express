import { Controller, Get, Param, Query } from '@nestjs/common';
import { SuperAdminOnly } from '../../auth/decorators/roles.decorator';
import { AdminOrdersService } from './admin-orders.service';
import { ListAdminOrdersQueryDto } from './dto/list-admin-orders-query.dto';

@Controller('admin/orders')
@SuperAdminOnly()
export class AdminOrdersController {
  constructor(private readonly orders: AdminOrdersService) {}

  @Get()
  list(@Query() query: ListAdminOrdersQueryDto) {
    return this.orders.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.get(id);
  }
}
