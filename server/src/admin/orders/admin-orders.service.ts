import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { paginated, parsePagination } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { ORDER_INCLUDE, serializeOrder } from '../../orders/order.serializer';
import { ListAdminOrdersQueryDto } from './dto/list-admin-orders-query.dto';

/**
 * Read-only cross-tenant order oversight for SuperAdmin (TZ §18.6). Reuses the
 * shared ORDER_INCLUDE + serializeOrder so the admin view stays in lockstep
 * with the customer/seller payloads. Intervention actions are deferred.
 */
@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListAdminOrdersQueryDto) {
    const { page, limit, skip, take } = parsePagination(query);
    const where: Prisma.OrderWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.storeId && { storeId: query.storeId }),
      ...(query.q && { orderNumber: { contains: query.q } }),
      ...((query.from || query.to) && {
        createdAt: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginated(items.map(serializeOrder), total, page, limit);
  }

  async get(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Buyurtma topilmadi');
    return serializeOrder(order);
  }
}
