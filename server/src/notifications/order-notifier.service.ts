import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus, type NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { decimalToNumber } from '../geo/geo';
import { NotificationsService } from './notifications.service';

interface Msg {
  title: string;
  body: string;
  type: NotificationType;
}

/**
 * Order lifecycle → notifications (TZ §9). One place that maps a status change
 * to the right recipients and copy, reused by both OrdersService (seller/
 * customer transitions + new order) and CourierService (accept/ON_WAY/
 * DELIVERED). Lives in NotificationsModule so both can inject it without a
 * circular dependency — it only depends on Prisma + NotificationsService.
 *
 * Every send is best-effort: a push failure must never roll back the status
 * write that triggered it (same fire-and-forget contract as DispatchService).
 */

/** Customer-facing copy for the transitions the buyer should hear about. */
const CUSTOMER_MESSAGES: Partial<Record<OrderStatus, Msg>> = {
  [OrderStatus.ACCEPTED]: {
    title: 'Buyurtma qabul qilindi ✅',
    body: 'Sotuvchi buyurtmangizni qabul qildi.',
    type: 'SUCCESS',
  },
  [OrderStatus.PREPARING]: {
    title: 'Tayyorlanmoqda 👨‍🍳',
    body: 'Buyurtmangiz tayyorlanmoqda.',
    type: 'INFO',
  },
  [OrderStatus.READY]: {
    title: 'Buyurtma tayyor 📦',
    body: 'Buyurtmangiz tayyor — kuryer kutilmoqda.',
    type: 'INFO',
  },
  [OrderStatus.COURIER_ASSIGNED]: {
    title: 'Kuryer tayinlandi 🛵',
    body: "Kuryer buyurtmangizni olishga yo'l oldi.",
    type: 'INFO',
  },
  [OrderStatus.ON_WAY]: {
    title: "Buyurtma yo'lda 🛵",
    body: "Kuryer buyurtmangizni olib yo'lga chiqdi.",
    type: 'INFO',
  },
  [OrderStatus.DELIVERED]: {
    title: 'Yetkazildi 🎉',
    body: 'Buyurtmangiz yetkazildi. Yoqimli ishtaha!',
    type: 'SUCCESS',
  },
  [OrderStatus.CANCELLED]: {
    title: 'Buyurtma bekor qilindi',
    body: 'Buyurtmangiz bekor qilindi.',
    type: 'WARNING',
  },
  [OrderStatus.REJECTED]: {
    title: 'Buyurtma rad etildi',
    body: 'Sotuvchi buyurtmangizni rad etdi.',
    type: 'DANGER',
  },
};

/** Seller-facing copy for the transitions a seller should hear about. */
const SELLER_MESSAGES: Partial<Record<OrderStatus, Msg>> = {
  [OrderStatus.COURIER_ASSIGNED]: {
    title: 'Kuryer biriktirildi 🛵',
    body: 'Buyurtmani kuryer oldi.',
    type: 'INFO',
  },
  [OrderStatus.DELIVERED]: {
    title: 'Buyurtma yetkazildi ✅',
    body: 'Kuryer buyurtmani yetkazib berdi.',
    type: 'SUCCESS',
  },
  [OrderStatus.CANCELLED]: {
    title: 'Buyurtma bekor qilindi',
    body: 'Buyurtma bekor qilindi.',
    type: 'WARNING',
  },
};

@Injectable()
export class OrderNotifierService {
  private readonly logger = new Logger(OrderNotifierService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** New order landed → ping the seller (store owner). Best-effort. */
  async newOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        store: { select: { ownerId: true } },
      },
    });
    if (!order?.store?.ownerId) return;
    const total = decimalToNumber(order.total) ?? 0;
    await this.push(
      [order.store.ownerId],
      'Yangi buyurtma 🛎️',
      `${order.orderNumber} — ${total} so'm. Qabul qilishni kutmoqda.`,
      'INFO',
      { orderId: order.id, link: `/dashboard/orders/${order.id}` },
    );
  }

  /** Notify the relevant parties after a status transition. Best-effort. */
  async statusChanged(orderId: string, status: OrderStatus): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        store: { select: { ownerId: true } },
      },
    });
    if (!order) return;

    const customer = CUSTOMER_MESSAGES[status];
    if (customer && order.userId) {
      await this.push(
        [order.userId],
        customer.title,
        customer.body,
        customer.type,
        {
          orderId: order.id,
          link: `/orders/${order.id}`,
        },
      );
    }

    const seller = SELLER_MESSAGES[status];
    if (seller && order.store?.ownerId) {
      await this.push(
        [order.store.ownerId],
        seller.title,
        seller.body,
        seller.type,
        {
          orderId: order.id,
          link: `/dashboard/orders/${order.id}`,
        },
      );
    }
  }

  private async push(
    userIds: string[],
    title: string,
    body: string,
    type: NotificationType,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (userIds.length === 0) return;
    await this.notifications
      .send(
        { target: 'USER', userIds, title, body, type, data },
        { type: 'SYSTEM', id: null },
      )
      .catch((e) => this.logger.warn(`order notify failed: ${String(e)}`));
  }
}
