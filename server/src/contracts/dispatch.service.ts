import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, type Prisma } from '@prisma/client';
import { decimalToNumber } from '../geo/geo';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderNotifierService } from '../notifications/order-notifier.service';
import { estimateCourierEarning } from '../courier/courier.serializer';

/**
 * One contracted courier handles one order at a time in v1. A courier with an
 * active order is "busy" — the order then falls back to the open pool.
 */
const MAX_CONCURRENT_PER_COURIER = 1;

const ACTIVE_STATUSES = [OrderStatus.COURIER_ASSIGNED, OrderStatus.ON_WAY];

/**
 * Routes a READY order to a contracted courier.
 *
 *   READY ──(free contracted courier exists)──▶ COURIER_ASSIGNED (auto)
 *   READY ──(all contracted couriers busy/offline)──▶ stays READY (open pool)
 *
 * Decoupled from OrdersService (talks to Prisma directly) so OrdersModule can
 * import ContractsModule without a circular dependency. Called fire-and-forget
 * from the seller's READY transition — a dispatch failure must never roll back
 * the order's status change.
 */
@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly orderNotifier: OrderNotifierService,
  ) {}

  /**
   * Seller-driven manual assignment: route a READY order to a CHOSEN contracted
   * courier. Request-driven (throws on invalid input) — unlike the fire-and-
   * forget auto-dispatch. Reuses the exact atomic claim + earning + history +
   * notify so the end state is identical to onOrderReady's auto-assign.
   */
  async assignToCourier(
    orderId: string,
    courierId: string,
    actorId: string,
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        storeId: true,
        orderNumber: true,
        deliveryFee: true,
        status: true,
        courierId: true,
        store: { select: { name: true } },
      },
    });
    if (!order) throw new NotFoundException('Buyurtma topilmadi');
    if (order.status !== OrderStatus.READY || order.courierId) {
      throw new ConflictException(
        'Bu buyurtma tayyor emas yoki allaqachon biriktirilgan',
      );
    }

    const courierIds = await this.activeContractCourierIds(order.storeId);
    if (!courierIds.includes(courierId)) {
      throw new BadRequestException(
        "Bu kuryer do'kon bilan faol kontraktga ega emas",
      );
    }

    const earning = estimateCourierEarning(decimalToNumber(order.deliveryFee) ?? 0);

    const res = await this.prisma.order.updateMany({
      where: { id: orderId, status: OrderStatus.READY, courierId: null },
      data: {
        courierId,
        status: OrderStatus.COURIER_ASSIGNED,
        courierAssignedAt: new Date(),
        courierEarning: earning,
      },
    });
    if (res.count === 0) {
      throw new ConflictException('Bu buyurtma allaqachon olingan');
    }

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: OrderStatus.COURIER_ASSIGNED,
        changedBy: actorId,
        note: 'Sotuvchi biriktirdi',
      },
    });

    await this.notifyMany(
      [courierId],
      'Yangi buyurtma — pochta bor 📦',
      `"${order.store.name}" buyurtmasi sizga biriktirildi (${order.orderNumber})`,
      'SUCCESS',
      { orderId: order.id, link: `/dashboard/deliveries/${order.id}` },
    );
    // Parity with courier self-accept: tell the customer a courier is on it.
    await this.orderNotifier
      .statusChanged(orderId, OrderStatus.COURIER_ASSIGNED)
      .catch(() => undefined);
  }

  async onOrderReady(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        storeId: true,
        orderNumber: true,
        deliveryFee: true,
        status: true,
        courierId: true,
        store: { select: { name: true } },
      },
    });
    if (!order || order.status !== OrderStatus.READY || order.courierId) return;

    const courierIds = await this.activeContractCourierIds(order.storeId);
    if (courierIds.length === 0) {
      // No contracted couriers — surface the order to the open pool so any
      // online courier can claim it (TZ §9 / §11.1).
      await this.notifyRole(
        'courier',
        'Yangi buyurtma 📦',
        `"${order.store.name}" — yangi buyurtma bo'sh navbatda`,
        'INFO',
        { orderId: order.id, link: '/dashboard/deliveries' },
      );
      return;
    }

    const chosen = await this.pickAvailableCourier(courierIds);
    if (!chosen) {
      // Every contracted courier is busy/offline → the order is left in the
      // pool. Nudge the contracted couriers so they can grab it when free.
      await this.notifyMany(
        courierIds,
        'Do\'koningizdan buyurtma 📦',
        `"${order.store.name}" buyurtmasi bo'sh navbatda — qabul qilishingiz mumkin`,
        'INFO',
        { orderId: order.id, link: '/dashboard/deliveries' },
      );
      return;
    }

    const earning = estimateCourierEarning(decimalToNumber(order.deliveryFee) ?? 0);

    // Atomic claim — identical guard to CourierService.accept so a pool courier
    // racing us loses cleanly.
    const res = await this.prisma.order.updateMany({
      where: { id: orderId, status: OrderStatus.READY, courierId: null },
      data: {
        courierId: chosen,
        status: OrderStatus.COURIER_ASSIGNED,
        courierAssignedAt: new Date(),
        courierEarning: earning,
      },
    });
    if (res.count === 0) return; // someone else grabbed it first

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: OrderStatus.COURIER_ASSIGNED,
        changedBy: 'system',
        note: 'Avto-biriktirildi: kontrakt',
      },
    });

    await this.notifyMany(
      [chosen],
      'Yangi buyurtma — pochta bor 📦',
      `"${order.store.name}" buyurtmasi sizga biriktirildi (${order.orderNumber})`,
      'SUCCESS',
      { orderId: order.id, link: `/dashboard/deliveries/${order.id}` },
    );
  }

  // ─── helpers ──────────────────────────────────────────────────────────

  /** Courier ids with an ACTIVE, non-expired contract for the store. */
  private async activeContractCourierIds(storeId: string): Promise<string[]> {
    const now = new Date();
    const rows = await this.prisma.courierContract.findMany({
      where: {
        storeId,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { courierId: true },
    });
    return rows.map((r) => r.courierId);
  }

  /**
   * Pick the best free courier: online, not blocked, under the concurrency cap,
   * least-recently-assigned first (round-robin / fair distribution). Returns
   * null when none are free.
   */
  private async pickAvailableCourier(courierIds: string[]): Promise<string | null> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: courierIds }, isBlocked: false },
      select: { id: true, profile: true },
    });
    const online = users.filter((u) => isCourierOnline(u.profile)).map((u) => u.id);
    if (online.length === 0) return null;

    const [activeCounts, lastAssigned] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['courierId'],
        where: { courierId: { in: online }, status: { in: ACTIVE_STATUSES } },
        _count: { _all: true },
      }),
      this.prisma.order.groupBy({
        by: ['courierId'],
        where: { courierId: { in: online } },
        _max: { courierAssignedAt: true },
      }),
    ]);
    const activeByCourier = new Map(
      activeCounts.map((r) => [r.courierId, r._count._all]),
    );
    const lastByCourier = new Map(
      lastAssigned.map((r) => [r.courierId, r._max.courierAssignedAt?.getTime() ?? 0]),
    );

    const free = online.filter(
      (id) => (activeByCourier.get(id) ?? 0) < MAX_CONCURRENT_PER_COURIER,
    );
    if (free.length === 0) return null;

    free.sort((a, b) => (lastByCourier.get(a) ?? 0) - (lastByCourier.get(b) ?? 0));
    return free[0];
  }

  private async notifyMany(
    userIds: string[],
    title: string,
    body: string,
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'ANNOUNCE',
    data?: Record<string, unknown>,
  ) {
    if (userIds.length === 0) return;
    await this.notifications
      .send({ target: 'USER', userIds, title, body, type, data }, { type: 'SYSTEM', id: null })
      .catch((e) => this.logger.warn(`dispatch notify failed: ${String(e)}`));
  }

  /** Push to every courier (open pool). Swallows the "no recipients" case. */
  private async notifyRole(
    roleSlug: string,
    title: string,
    body: string,
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'ANNOUNCE',
    data?: Record<string, unknown>,
  ) {
    await this.notifications
      .send({ target: 'ROLE', roleSlug, title, body, type, data }, { type: 'SYSTEM', id: null })
      .catch((e) => this.logger.warn(`dispatch role notify failed: ${String(e)}`));
  }
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
