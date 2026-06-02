/**
 * Mirrors server/src/orders/order.serializer.ts → `serializeOrder()`.
 */
export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "COURIER_ASSIGNED"
  | "ON_WAY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface OrderItem {
  id: string;
  offerId: string | null;
  productTitle: string;
  variantTitle: string | null;
  imageUrl: string | null;
  price: number;
  qty: number;
  subtotal: number;
}

export interface OrderHistoryEntry {
  id: string;
  status: OrderStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
}

export interface OrderAddressSnapshot {
  label: string;
  fullText: string;
  latitude: number;
  longitude: number;
  notes: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: "COD";
  subtotal: number;
  deliveryFee: number;
  total: number;
  distanceKm: number | null;
  notes: string | null;
  rejectionReason: string | null;
  customerName: string | null;
  customerPhone: string | null;
  addressSnapshot: OrderAddressSnapshot | null;
  store: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    phone: string | null;
    address: string | null;
  };
  items: OrderItem[];
  history: OrderHistoryEntry[];
  courierId: string | null;
  courierAssignedAt: string | null;
  acceptedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
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
