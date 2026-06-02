/**
 * Mirrors server/src/orders/order.serializer.ts `serializeOrder` output, served
 * cross-tenant via GET /admin/orders (paginated `{ data, meta }` envelope).
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
  changedBy: string;
  note: string | null;
  createdAt: string;
}

export interface OrderStoreRef {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  distanceKm: number | null;
  notes: string | null;
  rejectionReason: string | null;
  customerName: string | null;
  customerPhone: string | null;
  addressSnapshot: {
    label?: string;
    fullText?: string;
    latitude?: number;
    longitude?: number;
    notes?: string | null;
  } | null;
  store: OrderStoreRef;
  items: OrderItem[];
  history: OrderHistoryEntry[];
  acceptedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrders {
  data: AdminOrder[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ListAdminOrdersQuery {
  status?: OrderStatus;
  storeId?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
