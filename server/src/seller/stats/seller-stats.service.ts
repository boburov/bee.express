import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { decimalToNumber } from '../../geo/geo';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Seller dashboard stats (TZ §19.1) — scoped to the seller's own store.
 * Mirrors AdminStatsService but per-store. `revenueToday` uses subtotal (the
 * seller's money; delivery fee goes to the courier), matching seller-finance.
 */
@Injectable()
export class SellerStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(storeId: string) {
    const startToday = startOfToday();

    const [ordersToday, revenueAgg, activeProducts, ratingAgg, totalOrders, deliveredTotal] =
      await Promise.all([
        this.prisma.order.count({
          where: { storeId, createdAt: { gte: startToday } },
        }),
        this.prisma.order.aggregate({
          _sum: { subtotal: true },
          where: { storeId, status: OrderStatus.DELIVERED, deliveredAt: { gte: startToday } },
        }),
        this.prisma.sellerOffer.count({ where: { storeId, isActive: true } }),
        this.prisma.review.aggregate({
          _avg: { rating: true },
          where: { storeId, isVisible: true },
        }),
        this.prisma.order.count({ where: { storeId } }),
        this.prisma.order.count({ where: { storeId, status: OrderStatus.DELIVERED } }),
      ]);

    const rating = ratingAgg._avg.rating;

    return {
      ordersToday,
      revenueToday: decimalToNumber(revenueAgg._sum.subtotal) ?? 0,
      activeProducts,
      storeRating: rating !== null ? Math.round(rating * 10) / 10 : 0,
      conversionPct:
        totalOrders === 0 ? 0 : Math.round((deliveredTotal / totalOrders) * 100),
    };
  }
}

function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
