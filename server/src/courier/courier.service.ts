import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, type Prisma } from '@prisma/client';
import { paginated, parsePagination } from '../common/pagination';
import { ContractsService } from '../contracts/contracts.service';
import { boundingBox, decimalToNumber, haversineKm } from '../geo/geo';
import { PrismaService } from '../prisma/prisma.service';
import { AvailableOrdersQueryDto } from './dto/available-orders-query.dto';
import { CourierOrdersQueryDto } from './dto/courier-orders-query.dto';
import { UpdateCourierProfileDto } from './dto/update-courier-profile.dto';
import { UpdateCourierStatusDto } from './dto/update-courier-status.dto';
import {
  COURIER_ORDER_INCLUDE,
  estimateCourierEarning,
  serializeCourierOrder,
} from './courier.serializer';

/** Default search radius (km) when a courier hasn't set one and didn't pass one. */
const DEFAULT_RADIUS_KM = 15;

/**
 * Courier-driven transitions — mirrors the seller/customer machines in
 * OrdersService but scoped to the post-READY leg the courier owns:
 *
 *   READY            → COURIER_ASSIGNED  (accept — handled by accept(), not here)
 *   COURIER_ASSIGNED → ON_WAY            ("Mahsulotni oldim")
 *   ON_WAY           → DELIVERED         ("Yetkazdim")
 *
 * A COURIER_ASSIGNED order can also be released back to READY (see release()).
 */
const COURIER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.COURIER_ASSIGNED]: [OrderStatus.ON_WAY],
  [OrderStatus.ON_WAY]: [OrderStatus.DELIVERED],
};

interface CourierProfileData {
  transportType?: string;
  workRadiusKm?: number;
  categories?: string[];
  isOnline?: boolean;
}

@Injectable()
export class CourierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contracts: ContractsService,
  ) {}

  // ════════════════════════════════════════════════════════════════════
  // Available pool — READY orders no courier has claimed yet
  // ════════════════════════════════════════════════════════════════════

  async listAvailable(query: AvailableOrdersQueryDto, courierId: string) {
    const radiusKm = query.radiusKm ?? (await this.radiusFor(courierId));
    const point =
      query.lat !== undefined && query.lng !== undefined
        ? { lat: query.lat, lng: query.lng }
        : null;

    const where: Prisma.OrderWhereInput = {
      status: OrderStatus.READY,
      courierId: null,
    };

    // Bounding-box prefilter on the store (pickup point). Orders whose store
    // has no geo are excluded once a courier point is known — we can't price
    // or route them. Without a courier point we return the whole pool.
    if (point) {
      const bb = boundingBox(point.lat, point.lng, radiusKm);
      where.store = {
        latitude: { gte: bb.latMin, lte: bb.latMax },
        longitude: { gte: bb.lngMin, lte: bb.lngMax },
      };
    }

    const rows = await this.prisma.order.findMany({
      where,
      include: COURIER_ORDER_INCLUDE,
      orderBy: { createdAt: 'asc' },
      take: 60,
    });

    let cards = rows.map((o) =>
      serializeCourierOrder(o, { full: false, courierPoint: point }),
    );

    // Haversine refine + nearest-first sort once we know where the courier is.
    if (point) {
      cards = cards
        .filter((c) => c.pickupDistanceKm === null || c.pickupDistanceKm <= radiusKm)
        .sort((a, b) => (a.pickupDistanceKm ?? Infinity) - (b.pickupDistanceKm ?? Infinity));
    }

    return { radiusKm, orders: cards };
  }

  /** Atomically claim a READY order. Loses the race → 409. */
  async accept(orderId: string, courierId: string) {
    const detail = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, courierId: true, deliveryFee: true },
      });
      if (!order) throw new NotFoundException('Buyurtma topilmadi');
      if (order.status !== OrderStatus.READY || order.courierId) {
        throw new ConflictException('Bu buyurtma allaqachon olingan yoki hali tayyor emas');
      }

      const earning = estimateCourierEarning(decimalToNumber(order.deliveryFee) ?? 0);

      // The where-guard makes the claim atomic: a second courier's updateMany
      // matches zero rows once courierId is set.
      const res = await tx.order.updateMany({
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

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.COURIER_ASSIGNED,
          changedBy: courierId,
          note: 'Kuryer qabul qildi',
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: COURIER_ORDER_INCLUDE,
      });
    });

    // Pool fallback: a courier who claims a store's order from the open pool
    // gets a temporary contract so future orders can route to them too.
    await this.contracts
      .ensureTemporaryContract(courierId, detail.storeId)
      .catch(() => undefined);

    return serializeCourierOrder(detail, { full: true });
  }

  // ════════════════════════════════════════════════════════════════════
  // A courier's own orders
  // ════════════════════════════════════════════════════════════════════

  async listMine(query: CourierOrdersQueryDto, courierId: string) {
    const { page, limit, skip, take } = parsePagination(query);
    const where: Prisma.OrderWhereInput = { courierId };
    if (query.scope === 'active') {
      where.status = { in: [OrderStatus.COURIER_ASSIGNED, OrderStatus.ON_WAY] };
    } else if (query.scope === 'history') {
      where.status = OrderStatus.DELIVERED;
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: COURIER_ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginated(
      items.map((o) => serializeCourierOrder(o, { full: true })),
      total,
      page,
      limit,
    );
  }

  async getMine(orderId: string, courierId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: COURIER_ORDER_INCLUDE,
    });
    if (!order || order.courierId !== courierId) {
      throw new NotFoundException('Buyurtma topilmadi');
    }
    return serializeCourierOrder(order, { full: true });
  }

  async updateStatus(orderId: string, courierId: string, dto: UpdateCourierStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.courierId !== courierId) {
      throw new NotFoundException('Buyurtma topilmadi');
    }

    const allowed = COURIER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`${order.status} dan ${dto.status} ga o'tib bo'lmaydi`);
    }

    await this.prisma.$transaction(async (tx) => {
      const data: Prisma.OrderUpdateInput = { status: dto.status };
      if (dto.status === OrderStatus.ON_WAY) data.pickedUpAt = new Date();
      if (dto.status === OrderStatus.DELIVERED) data.deliveredAt = new Date();
      await tx.order.update({ where: { id: orderId }, data });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: dto.status,
          changedBy: courierId,
          note: dto.note ?? null,
        },
      });
    });

    return this.getMine(orderId, courierId);
  }

  /** Drop an assigned order back into the pool — only before pickup. */
  async release(orderId: string, courierId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.courierId !== courierId) {
      throw new NotFoundException('Buyurtma topilmadi');
    }
    if (order.status !== OrderStatus.COURIER_ASSIGNED) {
      throw new BadRequestException(
        "Faqat mahsulotni olishdan oldin buyurtmani qaytarish mumkin",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.READY,
          courierId: null,
          courierAssignedAt: null,
          courierEarning: null,
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.READY,
          changedBy: courierId,
          note: reason ? `Kuryer qaytardi: ${reason}` : 'Kuryer buyurtmani qaytardi',
        },
      });
    });

    return { ok: true };
  }

  // ════════════════════════════════════════════════════════════════════
  // Stats / earnings
  // ════════════════════════════════════════════════════════════════════

  async stats(courierId: string) {
    const now = new Date();
    const startToday = startOfDay(now);
    const startWeek = startOfWeek(now);
    const startMonth = startOfMonth(now);

    // One read for the whole month covers today + week buckets too.
    const delivered = await this.prisma.order.findMany({
      where: {
        courierId,
        status: OrderStatus.DELIVERED,
        deliveredAt: { gte: startMonth },
      },
      select: { deliveredAt: true, courierEarning: true, deliveryFee: true },
    });

    const bucket = (since: Date) => {
      const rows = delivered.filter((r) => r.deliveredAt && r.deliveredAt >= since);
      return {
        deliveries: rows.length,
        earning: rows.reduce((s, r) => s + (decimalToNumber(r.courierEarning) ?? 0), 0),
      };
    };

    const active = await this.prisma.order.findMany({
      where: {
        courierId,
        status: { in: [OrderStatus.COURIER_ASSIGNED, OrderStatus.ON_WAY] },
      },
      include: COURIER_ORDER_INCLUDE,
      orderBy: { courierAssignedAt: 'desc' },
    });

    const totalCount = await this.prisma.order.count({
      where: { courierId, status: OrderStatus.DELIVERED },
    });
    const totalAgg = await this.prisma.order.aggregate({
      where: { courierId, status: OrderStatus.DELIVERED },
      _sum: { courierEarning: true, deliveryFee: true },
    });
    const totalEarning = decimalToNumber(totalAgg._sum.courierEarning) ?? 0;
    const totalGross = decimalToNumber(totalAgg._sum.deliveryFee) ?? 0;

    return {
      today: bucket(startToday),
      week: bucket(startWeek),
      month: bucket(startMonth),
      total: {
        deliveries: totalCount,
        earning: totalEarning,
        grossDeliveryFees: totalGross,
        platformCommission: Math.max(0, totalGross - totalEarning),
      },
      activeOrders: active.map((o) => serializeCourierOrder(o, { full: true })),
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // Profile (stored in User.profile.courier)
  // ════════════════════════════════════════════════════════════════════

  async getProfile(courierId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: courierId },
      select: { id: true, firstName: true, lastName: true, phone: true, profile: true },
    });
    const c = this.readCourierProfile(user.profile);
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone.toString(),
      transportType: c.transportType ?? null,
      workRadiusKm: c.workRadiusKm ?? null,
      categories: c.categories ?? [],
      isOnline: c.isOnline ?? false,
      // Courier rating depends on a courier-review system that doesn't exist
      // yet — surface null so the UI shows "—" rather than a fake number.
      rating: null,
    };
  }

  async updateProfile(courierId: string, dto: UpdateCourierProfileDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: courierId },
      select: { profile: true },
    });

    const current = this.readCourierProfile(user.profile);
    const nextCourier: CourierProfileData = { ...current };
    if (dto.transportType !== undefined) nextCourier.transportType = dto.transportType;
    if (dto.workRadiusKm !== undefined) nextCourier.workRadiusKm = dto.workRadiusKm;
    if (dto.categories !== undefined) nextCourier.categories = dto.categories;
    if (dto.isOnline !== undefined) nextCourier.isOnline = dto.isOnline;

    const baseProfile =
      user.profile && typeof user.profile === 'object' && !Array.isArray(user.profile)
        ? (user.profile as Record<string, unknown>)
        : {};

    const data: Prisma.UserUpdateInput = {
      profile: { ...baseProfile, courier: nextCourier } as unknown as Prisma.InputJsonValue,
    };
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;

    await this.prisma.user.update({ where: { id: courierId }, data });
    return this.getProfile(courierId);
  }

  // ─── helpers ────────────────────────────────────────────────────────

  private async radiusFor(courierId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: courierId },
      select: { profile: true },
    });
    return this.readCourierProfile(user?.profile ?? null).workRadiusKm ?? DEFAULT_RADIUS_KM;
  }

  private readCourierProfile(profile: Prisma.JsonValue | null): CourierProfileData {
    if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
      const c = (profile as Record<string, unknown>).courier;
      if (c && typeof c === 'object' && !Array.isArray(c)) {
        return c as CourierProfileData;
      }
    }
    return {};
  }
}

// ─── date bucketing (server-local) ──────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday 00:00 of the current week. */
function startOfWeek(d: Date): Date {
  const offset = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  const s = startOfDay(d);
  s.setDate(s.getDate() - offset);
  return s;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
