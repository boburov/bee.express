/**
 * Mirrors server/src/courier/courier.serializer.ts → serializeCourierOrder().
 * Detail-only fields (items/history/rejectionReason) are present when the
 * order is the courier's own; pool cards omit them.
 */
export type CourierOrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "COURIER_ASSIGNED"
  | "ON_WAY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface CourierPickup {
  storeId: string;
  storeName: string;
  storeSlug: string;
  logoUrl: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
}

export interface CourierDropoff {
  latitude: number | null;
  longitude: number | null;
  label: string | null;
  fullText: string | null;
  notes: string | null;
  customerName: string | null;
  customerPhone: string | null;
}

export interface CourierOrderItem {
  id: string;
  productTitle: string;
  variantTitle: string | null;
  imageUrl: string | null;
  price: number;
  qty: number;
  subtotal: number;
}

export interface CourierOrderHistory {
  id: string;
  status: CourierOrderStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
}

export interface CourierOrder {
  id: string;
  orderNumber: string;
  status: CourierOrderStatus;
  paymentMethod: "COD";
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** Store → customer distance (set at checkout). */
  distanceKm: number | null;
  /** Courier → store distance (computed when a courier point is known). */
  pickupDistanceKm: number | null;
  earning: number;
  itemsCount: number;
  pickup: CourierPickup;
  dropoff: CourierDropoff;
  notes: string | null;
  createdAt: string;
  courierAssignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  // detail-only
  rejectionReason?: string | null;
  items?: CourierOrderItem[];
  history?: CourierOrderHistory[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AvailableResponse {
  radiusKm: number;
  orders: CourierOrder[];
}

export interface EarningBucket {
  deliveries: number;
  earning: number;
}

export interface CourierStats {
  today: EarningBucket;
  week: EarningBucket;
  month: EarningBucket;
  total: {
    deliveries: number;
    earning: number;
    grossDeliveryFees: number;
    platformCommission: number;
  };
  activeOrders: CourierOrder[];
}

export type TransportType = "WALK" | "BICYCLE" | "MOTORBIKE" | "CAR" | "TRUCK";

export interface CourierProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  transportType: TransportType | null;
  workRadiusKm: number | null;
  categories: string[];
  isOnline: boolean;
  rating: number | null;
}
