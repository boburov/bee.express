import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  type Address,
  OrderStatus,
  PaymentMethod,
  type Prisma,
} from '@prisma/client';
import { AddressesService } from '../addresses/addresses.service';
import { DispatchService } from '../contracts/dispatch.service';
import { paginated, parsePagination } from '../common/pagination';
import { computeDeliveryFee, decimalToNumber, haversineKm } from '../geo/geo';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { ORDER_INCLUDE, serializeOrder } from './order.serializer';

/**
 * Allowed status transitions. Anything not listed here is rejected with a 400.
 *
 *   PENDING          → ACCEPTED | REJECTED | CANCELLED
 *   ACCEPTED         → PREPARING | CANCELLED
 *   PREPARING        → READY | CANCELLED
 *   READY            → ON_WAY | CANCELLED
 *   ON_WAY           → DELIVERED
 *   COURIER_ASSIGNED → (courier-owned — seller has no moves)
 *   DELIVERED        → (terminal)
 *   CANCELLED        → (terminal)
 *   REJECTED         → (terminal)
 *
 * Customer can only fire CANCELLED from PENDING. The seller drives up to READY.
 * From READY the seller may still self-deliver (READY → ON_WAY) — e.g. a store
 * with its own courier (TZ §3.4) — but normally a courier claims the order
 * (READY → COURIER_ASSIGNED) and the courier machine in CourierService takes
 * over. Once COURIER_ASSIGNED, the seller has no transitions.
 */
const SELLER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.ACCEPTED, OrderStatus.REJECTED],
  ACCEPTED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.ON_WAY, OrderStatus.CANCELLED],
  COURIER_ASSIGNED: [],
  ON_WAY: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly addresses: AddressesService,
    private readonly dispatch: DispatchService,
  ) {}

  // ════════════════════════════════════════════════════════════════════
  // Customer side
  // ════════════════════════════════════════════════════════════════════

  /**
   * Cart → orders. One Order per Store. For each store we:
   *   1. re-fetch live offers, validate stock
   *   2. compute distance + delivery fee from chosen Address vs Store geo
   *   3. snapshot product/variant/image titles into OrderItem
   *   4. decrement SellerOffer.stock
   *   5. wipe the cart
   * All inside a single transaction — partial checkouts are not allowed.
   */
  async checkout(dto: CheckoutDto, userId: string) {
    const address = await this.addresses.getOwnedOrThrow(dto.addressId, userId);

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            offer: {
              include: {
                store: {
                  include: {
                    offers: false,
                  },
                },
                variant: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        title: true,
                        categoryId: true,
                        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Savatingiz bo'sh");
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });

    // Group items by store. Each group becomes one Order.
    const byStore = new Map<string, typeof cart.items>();
    for (const it of cart.items) {
      const sid = it.offer.storeId;
      const list = byStore.get(sid) ?? [];
      list.push(it);
      byStore.set(sid, list);
    }

    // Pre-validate every store + every item BEFORE we touch the DB. Failing
    // fast on the first issue keeps error messages targeted.
    for (const [, items] of byStore) {
      const store = items[0].offer.store;
      if (store.status !== 'ACTIVE') {
        throw new BadRequestException(`"${store.name}" hozir buyurtma qabul qilmaydi`);
      }
      if (!store.isOpen) {
        throw new BadRequestException(`"${store.name}" hozir yopiq`);
      }
      for (const it of items) {
        if (!it.offer.isActive) {
          throw new BadRequestException(
            `"${it.offer.variant.product.title}" sotuvdan olib tashlandi — savatdan olib tashlang`,
          );
        }
        if (it.offer.stock < it.qty) {
          throw new BadRequestException(
            `"${it.offer.variant.product.title}" qoldig'i yetarli emas (mavjud: ${it.offer.stock})`,
          );
        }
      }
    }

    // Category-level delivery fee defaults are needed when a store hasn't set
    // its own overrides — pre-load distinct categories in one query.
    const categoryIds = Array.from(
      new Set(cart.items.map((it) => it.offer.variant.product.categoryId)),
    );
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: {
        id: true,
        type: true,
        deliveryBaseFee: true,
        deliveryPerKmFee: true,
        deliveryRadiusKm: true,
      },
    });
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    const addrLat = decimalToNumber(address.latitude)!;
    const addrLng = decimalToNumber(address.longitude)!;

    // Now actually persist — one transaction for the whole checkout.
    const created = await this.prisma.$transaction(async (tx) => {
      const out: string[] = [];

      for (const [storeId, items] of byStore) {
        const store = items[0].offer.store;
        const storeLat = decimalToNumber(store.latitude);
        const storeLng = decimalToNumber(store.longitude);

        // Pick the "primary" category for fee math. If a multi-category cart
        // ever lands at the same seller, take the first item's category —
        // shouldn't happen in practice because food vs marketplace stores
        // don't overlap, but it's a safe default.
        const primaryCategory = categoryById.get(items[0].offer.variant.product.categoryId);

        let distanceKm: number | null = null;
        let deliveryFee = 0;

        if (storeLat !== null && storeLng !== null) {
          distanceKm = haversineKm(
            { lat: addrLat, lng: addrLng },
            { lat: storeLat, lng: storeLng },
          );

          // For FOOD, enforce the radius. For MARKETPLACE we don't gate.
          if (primaryCategory?.type === 'FOOD') {
            const radius =
              decimalToNumber(store.deliveryRadiusKm) ??
              primaryCategory.deliveryRadiusKm;
            if (radius && distanceKm > radius) {
              throw new BadRequestException(
                `"${store.name}" yetkazib berish radiusi: ${radius}km, manzilingiz ${distanceKm.toFixed(1)}km`,
              );
            }
          }

          const fee = computeDeliveryFee(
            distanceKm,
            {
              baseFee: decimalToNumber(store.deliveryBaseFee),
              perKmFee: decimalToNumber(store.deliveryPerKmFee),
            },
            primaryCategory
              ? {
                  baseFee: decimalToNumber(primaryCategory.deliveryBaseFee),
                  perKmFee: decimalToNumber(primaryCategory.deliveryPerKmFee),
                }
              : null,
          );
          deliveryFee = fee ?? 0;
        }

        const subtotal = items.reduce(
          (sum, it) => sum + decimalToNumber(it.offer.price)! * it.qty,
          0,
        );
        const total = subtotal + deliveryFee;

        const order = await tx.order.create({
          data: {
            orderNumber: this.makeOrderNumber(),
            userId,
            storeId,
            addressId: address.id,
            status: OrderStatus.PENDING,
            paymentMethod: (dto.paymentMethod as PaymentMethod) ?? PaymentMethod.COD,
            subtotal,
            deliveryFee,
            total,
            distanceKm: distanceKm ?? null,
            notes: dto.notes ?? null,
            addressSnapshot: this.addressSnapshot(address),
            customerName: this.customerName(user),
            customerPhone: user.phone,
            items: {
              create: items.map((it) => ({
                offerId: it.offerId,
                productTitle: it.offer.variant.product.title,
                variantTitle: it.offer.variant.sku ?? null,
                imageUrl: it.offer.variant.product.images[0]?.url ?? null,
                price: it.offer.price,
                qty: it.qty,
                subtotal: decimalToNumber(it.offer.price)! * it.qty,
              })),
            },
            history: {
              create: {
                status: OrderStatus.PENDING,
                changedBy: userId,
                note: 'Buyurtma yaratildi',
              },
            },
          },
        });

        // Decrement stock and auto-deactivate offers that hit zero.
        for (const it of items) {
          const updated = await tx.sellerOffer.update({
            where: { id: it.offerId },
            data: { stock: { decrement: it.qty } },
            select: { stock: true },
          });
          if (updated.stock <= 0) {
            await tx.sellerOffer.update({
              where: { id: it.offerId },
              data: { isActive: false },
            });
          }
        }

        out.push(order.id);
      }

      // Wipe the cart.
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return out;
    });

    // Hydrate + return all freshly-created orders.
    const orders = await this.prisma.order.findMany({
      where: { id: { in: created } },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return { orders: orders.map(serializeOrder) };
  }

  async listMine(query: ListOrdersQueryDto, userId: string) {
    const { page, limit, skip, take } = parsePagination(query);
    const where: Prisma.OrderWhereInput = {
      userId,
      ...(query.status && { status: query.status }),
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

  async getMineById(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Buyurtma topilmadi');
    if (order.userId !== userId) throw new ForbiddenException();
    return serializeOrder(order);
  }

  /** Customer-side cancel — only while still PENDING. */
  async cancelMine(id: string, userId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Buyurtma topilmadi');
    if (order.userId !== userId) throw new ForbiddenException();
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        "Faqat PENDING holatdagi buyurtmani bekor qila olasiz",
      );
    }

    await this.transitionStatus(order.id, OrderStatus.CANCELLED, userId, reason ?? null);
    return this.getMineById(id, userId);
  }

  // ════════════════════════════════════════════════════════════════════
  // Seller side
  // ════════════════════════════════════════════════════════════════════

  async listForStore(storeId: string, query: ListOrdersQueryDto) {
    const { page, limit, skip, take } = parsePagination(query);
    const where: Prisma.OrderWhereInput = {
      storeId,
      ...(query.status && { status: query.status }),
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

  async getForStore(orderId: string, storeId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order || order.storeId !== storeId) {
      throw new NotFoundException('Buyurtma topilmadi');
    }
    return serializeOrder(order);
  }

  async updateStatusForStore(
    orderId: string,
    storeId: string,
    sellerId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.storeId !== storeId) {
      throw new NotFoundException('Buyurtma topilmadi');
    }

    const allowed = SELLER_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `${order.status} dan ${dto.status} ga o'tib bo'lmaydi`,
      );
    }

    await this.transitionStatus(order.id, dto.status, sellerId, dto.note ?? null);
    return this.getForStore(orderId, storeId);
  }

  // ─── helpers ────────────────────────────────────────────────────────

  /**
   * Single source of truth for status writes. Updates timestamps + writes the
   * audit row + restores stock on terminal-cancel transitions. Called by both
   * customer cancel and seller transition paths.
   */
  private async transitionStatus(
    orderId: string,
    next: OrderStatus,
    actorId: string,
    note: string | null,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const data: Prisma.OrderUpdateInput = { status: next };
      if (next === OrderStatus.ACCEPTED) data.acceptedAt = new Date();
      if (next === OrderStatus.DELIVERED) data.deliveredAt = new Date();
      if (next === OrderStatus.CANCELLED || next === OrderStatus.REJECTED) {
        data.cancelledAt = new Date();
        if (note) data.rejectionReason = note;

        // Restore stock so other buyers can grab the items.
        const items = await tx.orderItem.findMany({
          where: { orderId, offerId: { not: null } },
          select: { offerId: true, qty: true },
        });
        for (const it of items) {
          if (!it.offerId) continue;
          await tx.sellerOffer.update({
            where: { id: it.offerId },
            data: { stock: { increment: it.qty }, isActive: true },
          });
        }
      }
      await tx.order.update({ where: { id: orderId }, data });
      await tx.orderStatusHistory.create({
        data: { orderId, status: next, changedBy: actorId, note },
      });
    });

    // Once an order is READY, try to auto-assign it to a contracted courier.
    // Best-effort: a dispatch failure must never undo the seller's transition.
    if (next === OrderStatus.READY) {
      await this.dispatch.onOrderReady(orderId).catch((e) => {
        this.logger.warn(`dispatch onOrderReady(${orderId}) failed: ${String(e)}`);
      });
    }
  }

  private addressSnapshot(a: Address): Prisma.InputJsonValue {
    return {
      label: a.label,
      fullText: a.fullText,
      latitude: decimalToNumber(a.latitude)!,
      longitude: decimalToNumber(a.longitude)!,
      notes: a.notes ?? null,
    };
  }

  private customerName(user: {
    firstName: string | null;
    lastName: string | null;
  }): string | null {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length === 0 ? null : parts.join(' ');
  }

  /** BEE-YYMMDD-XXXX, where XXXX is the millisecond-fraction of now. */
  private makeOrderNumber(): string {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    // Use milliseconds + a random nibble — uniqueness is guarded by the DB
    // anyway via @unique, but collisions should be vanishingly rare.
    const tail = String(d.getTime() % 100000).padStart(5, '0');
    const rand = Math.floor(Math.random() * 36).toString(36).toUpperCase();
    return `BEE-${yy}${mm}${dd}-${tail}${rand}`;
  }
}
