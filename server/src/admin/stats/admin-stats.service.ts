import { Injectable } from '@nestjs/common';
import { OrderStatus, type Prisma } from '@prisma/client';
import { decimalToNumber } from '../../geo/geo';
import { PrismaService } from '../../prisma/prisma.service';
import { FinanceQueryDto } from './dto/finance-query.dto';

/**
 * Read-only aggregates for the SuperAdmin dashboard (TZ §18.1) and finance
 * summary (TZ §18.7). All math reuses fields already snapshotted on Order —
 * there's no payout/settlement model in MVP, so platform income is derived
 * from the delivery-fee margin (deliveryFee − courierEarning).
 */
@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const startToday = startOfToday();

    const [
      ordersToday,
      revenueAgg,
      activeStores,
      activeCouriers,
      newSignupsToday,
      totalOrders,
      deliveredTotal,
    ] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: startToday } } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: OrderStatus.DELIVERED, deliveredAt: { gte: startToday } },
      }),
      this.prisma.store.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { isBlocked: false, role: { slug: 'courier' } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startToday } } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
    ]);

    return {
      ordersToday,
      revenueToday: decimalToNumber(revenueAgg._sum.total) ?? 0,
      activeCouriers,
      activeStores,
      newSignupsToday,
      conversionPct:
        totalOrders === 0 ? 0 : Math.round((deliveredTotal / totalOrders) * 100),
    };
  }

  async finance(query: FinanceQueryDto) {
    const where: Prisma.OrderWhereInput = {
      status: OrderStatus.DELIVERED,
      ...((query.from || query.to) && {
        deliveredAt: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
    };

    const [deliveredOrders, agg] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: { total: true, subtotal: true, deliveryFee: true, courierEarning: true },
      }),
    ]);

    const grossSales = decimalToNumber(agg._sum.total) ?? 0;
    const productSales = decimalToNumber(agg._sum.subtotal) ?? 0;
    const deliveryFees = decimalToNumber(agg._sum.deliveryFee) ?? 0;
    const courierPayouts = decimalToNumber(agg._sum.courierEarning) ?? 0;

    return {
      deliveredOrders,
      grossSales,
      productSales,
      deliveryFees,
      courierPayouts,
      // Platform's modeled income in MVP: the delivery-fee margin.
      platformCommission: Math.max(0, deliveryFees - courierPayouts),
    };
  }
}

function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
