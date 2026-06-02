import type { Prisma } from '@prisma/client';
import { decimalToNumber } from '../geo/geo';

/**
 * One include shape, two consumers (customer + seller). Keep it broad enough
 * that both views read from the same hydrated payload.
 */
export const ORDER_INCLUDE = {
  items: { orderBy: { id: 'asc' as const } },
  store: {
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      phone: true,
      address: true,
    },
  },
  history: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;

export type HydratedOrder = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

export function serializeOrder(order: HydratedOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: decimalToNumber(order.subtotal)!,
    deliveryFee: decimalToNumber(order.deliveryFee)!,
    total: decimalToNumber(order.total)!,
    distanceKm: decimalToNumber(order.distanceKm),
    notes: order.notes,
    rejectionReason: order.rejectionReason,
    customerName: order.customerName,
    customerPhone: order.customerPhone ? order.customerPhone.toString() : null,
    addressSnapshot: order.addressSnapshot ?? null,
    store: order.store,
    items: order.items.map((it) => ({
      id: it.id,
      offerId: it.offerId,
      productTitle: it.productTitle,
      variantTitle: it.variantTitle,
      imageUrl: it.imageUrl,
      price: decimalToNumber(it.price)!,
      qty: it.qty,
      subtotal: decimalToNumber(it.subtotal)!,
    })),
    history: order.history.map((h) => ({
      id: h.id,
      status: h.status,
      changedBy: h.changedBy,
      note: h.note,
      createdAt: h.createdAt,
    })),
    courierId: order.courierId,
    courierAssignedAt: order.courierAssignedAt,
    acceptedAt: order.acceptedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export type SerializedOrder = ReturnType<typeof serializeOrder>;
