import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { decimalToNumber } from '../../geo/geo';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Seller finance summary (TZ §19.6). Read-only aggregates over the seller's
 * own delivered orders. `productSales` (subtotal) is the seller's revenue;
 * `deliveryFees` is pass-through to the courier/platform — no settlement model
 * exists in MVP, so these are reporting figures, not a ledger.
 */
@Injectable()
export class SellerFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(storeId: string) {
    const startToday = startOfToday();
    const baseWhere = { storeId, status: OrderStatus.DELIVERED };

    const [agg, todayAgg, todayCount, deliveredCount, activeCount] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: baseWhere,
          _sum: { total: true, subtotal: true, deliveryFee: true },
        }),
        this.prisma.order.aggregate({
          where: { ...baseWhere, deliveredAt: { gte: startToday } },
          _sum: { subtotal: true },
        }),
        this.prisma.order.count({
          where: { ...baseWhere, deliveredAt: { gte: startToday } },
        }),
        this.prisma.order.count({ where: baseWhere }),
        this.prisma.order.count({
          where: {
            storeId,
            status: {
              in: [
                OrderStatus.PENDING,
                OrderStatus.ACCEPTED,
                OrderStatus.PREPARING,
                OrderStatus.READY,
                OrderStatus.COURIER_ASSIGNED,
                OrderStatus.ON_WAY,
              ],
            },
          },
        }),
      ]);

    return {
      deliveredOrders: deliveredCount,
      productSales: decimalToNumber(agg._sum.subtotal) ?? 0,
      deliveryFees: decimalToNumber(agg._sum.deliveryFee) ?? 0,
      grossSales: decimalToNumber(agg._sum.total) ?? 0,
      todayOrders: todayCount,
      todayProductSales: decimalToNumber(todayAgg._sum.subtotal) ?? 0,
      activeOrders: activeCount,
    };
  }
}

function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
