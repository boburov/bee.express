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

    const deliveredToday: Prisma.OrderWhereInput = {
      status: OrderStatus.DELIVERED,
      deliveredAt: { gte: startToday },
    };

    const [
      ordersToday,
      todayAgg,
      activeStores,
      activeCouriers,
      courierProfiles,
      newSignupsToday,
      totalOrders,
      deliveredTotal,
    ] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: startToday } } }),
      this.prisma.order.aggregate({
        _sum: { total: true, subtotal: true, deliveryFee: true, courierEarning: true },
        where: deliveredToday,
      }),
      this.prisma.store.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { isBlocked: false, role: { slug: 'courier' } } }),
      this.prisma.user.findMany({
        where: { isBlocked: false, role: { slug: 'courier' } },
        select: { profile: true },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: startToday } } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
    ]);

    // Gross revenue (order total) and product sales (subtotal, excl. delivery).
    const revenueToday = decimalToNumber(todayAgg._sum.total) ?? 0;
    const productSalesToday = decimalToNumber(todayAgg._sum.subtotal) ?? 0;
    // Platform profit in MVP = delivery-fee margin (deliveryFee − courierEarning).
    const deliveryFeesToday = decimalToNumber(todayAgg._sum.deliveryFee) ?? 0;
    const courierPayoutsToday = decimalToNumber(todayAgg._sum.courierEarning) ?? 0;
    const profitToday = Math.max(0, deliveryFeesToday - courierPayoutsToday);

    // Couriers currently on shift (profile.courier.isOnline === true).
    const workingCouriers = courierProfiles.filter((u) => isCourierOnline(u.profile)).length;

    return {
      ordersToday,
      revenueToday,
      productSalesToday,
      profitToday,
      activeCouriers,
      workingCouriers,
      activeStores,
      newSignupsToday,
      conversionPct:
        totalOrders === 0 ? 0 : Math.round((deliveredTotal / totalOrders) * 100),
    };
  }

  /**
   * Daily orders & revenue for the last `days` days (default 14), oldest first.
   * Orders are bucketed by createdAt; revenue is the delivered-order total
   * bucketed by deliveredAt — matching the single-day dashboard figures. Empty
   * days are zero-filled so the chart has a continuous x-axis.
   */
  async timeseries(days = 14) {
    const span = Math.min(Math.max(days, 1), 90);
    const start = startOfToday();
    start.setDate(start.getDate() - (span - 1));

    const [created, delivered] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { status: OrderStatus.DELIVERED, deliveredAt: { gte: start } },
        select: { deliveredAt: true, total: true },
      }),
    ]);

    // Seed every day in the window with zeros.
    const buckets = new Map<string, { date: string; orders: number; revenue: number }>();
    for (let i = 0; i < span; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dateKey(d);
      buckets.set(key, { date: key, orders: 0, revenue: 0 });
    }

    for (const o of created) {
      const b = buckets.get(dateKey(o.createdAt));
      if (b) b.orders += 1;
    }
    for (const o of delivered) {
      if (!o.deliveredAt) continue;
      const b = buckets.get(dateKey(o.deliveredAt));
      if (b) b.revenue += decimalToNumber(o.total) ?? 0;
    }

    return Array.from(buckets.values());
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

/** Local-date key (YYYY-MM-DD) for day-bucketing. */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Reads `profile.courier.isOnline` from the User.profile JSON blob. */
function isCourierOnline(profile: Prisma.JsonValue | null): boolean {
  if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
    const c = (profile as Record<string, unknown>).courier;
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      return (c as Record<string, unknown>).isOnline === true;
    }
  }
  return false;
}
