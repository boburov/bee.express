import type { Prisma } from '@prisma/client';
import { decimalToNumber, haversineKm } from '../geo/geo';

/**
 * Courier's cut of the delivery fee. TZ §11.4: a freelance courier keeps
 * ~70–80% of the delivery fee, the platform keeps the rest. We snapshot the
 * computed amount onto the order at assignment time so later fee-formula
 * changes never rewrite a past payout.
 */
export const COURIER_DELIVERY_SHARE = 0.8;

/** Round to the nearest 100 so'm — mirrors computeDeliveryFee()'s rounding. */
export function estimateCourierEarning(deliveryFee: number): number {
  return Math.round((deliveryFee * COURIER_DELIVERY_SHARE) / 100) * 100;
}

/**
 * Include shape for every courier-facing order read. Adds store geo (needed
 * for the pickup-distance math) on top of the customer/seller include.
 */
export const COURIER_ORDER_INCLUDE = {
  items: { orderBy: { id: 'asc' as const } },
  store: {
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      phone: true,
      address: true,
      latitude: true,
      longitude: true,
    },
  },
  history: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;

export type HydratedCourierOrder = Prisma.OrderGetPayload<{
  include: typeof COURIER_ORDER_INCLUDE;
}>;

interface AddressSnapshot {
  label?: string;
  fullText?: string;
  latitude?: number;
  longitude?: number;
  notes?: string | null;
}

interface SerializeOpts {
  /**
   * Full view = the order belongs to this courier, so contact details
   * (seller + customer phones, exact dropoff address) are revealed and the
   * items + history are attached. List/pool view keeps PII hidden.
   */
  full: boolean;
  /** Courier's current location — enables the courier→pickup distance. */
  courierPoint?: { lat: number; lng: number } | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * One serializer, two audiences:
 *   - pool cards (`full: false`)  — distances + earning, no PII
 *   - own-order detail (`full: true`) — everything the courier needs to work
 */
export function serializeCourierOrder(order: HydratedCourierOrder, opts: SerializeOpts) {
  const snap = (order.addressSnapshot ?? null) as AddressSnapshot | null;

  const storeLat = decimalToNumber(order.store.latitude);
  const storeLng = decimalToNumber(order.store.longitude);

  const pickupDistanceKm =
    opts.courierPoint && storeLat !== null && storeLng !== null
      ? round1(haversineKm(opts.courierPoint, { lat: storeLat, lng: storeLng }))
      : null;

  const deliveryFee = decimalToNumber(order.deliveryFee) ?? 0;
  const earning = decimalToNumber(order.courierEarning) ?? estimateCourierEarning(deliveryFee);

  const base = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: decimalToNumber(order.subtotal)!,
    deliveryFee,
    total: decimalToNumber(order.total)!,
    // store → customer distance, computed at checkout
    distanceKm: decimalToNumber(order.distanceKm),
    // courier → store distance, computed now (null without a courier point)
    pickupDistanceKm,
    earning,
    itemsCount: order.items.length,
    pickup: {
      storeId: order.store.id,
      storeName: order.store.name,
      storeSlug: order.store.slug,
      logoUrl: order.store.logoUrl,
      address: order.store.address,
      latitude: storeLat,
      longitude: storeLng,
      phone: opts.full ? order.store.phone : null,
    },
    dropoff: {
      latitude: snap?.latitude ?? null,
      longitude: snap?.longitude ?? null,
      label: opts.full ? (snap?.label ?? null) : null,
      fullText: opts.full ? (snap?.fullText ?? null) : null,
      notes: opts.full ? (snap?.notes ?? null) : null,
      customerName: opts.full ? order.customerName : null,
      customerPhone:
        opts.full && order.customerPhone ? order.customerPhone.toString() : null,
    },
    notes: opts.full ? order.notes : null,
    createdAt: order.createdAt,
    courierAssignedAt: order.courierAssignedAt,
    pickedUpAt: order.pickedUpAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
  };

  if (!opts.full) return base;

  return {
    ...base,
    rejectionReason: order.rejectionReason,
    items: order.items.map((it) => ({
      id: it.id,
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
  };
}

export type SerializedCourierOrder = ReturnType<typeof serializeCourierOrder>;
