import { api } from "@/shared/auth/api";
import type {
  AdminOrder,
  ListAdminOrdersQuery,
  OrderStatus,
  PaginatedOrders,
} from "./types";

export const ordersApi = {
  list: (query: ListAdminOrdersQuery = {}) =>
    api
      .get<PaginatedOrders>("/admin/orders", { params: query })
      .then((r) => r.data),
  get: (id: string) =>
    api.get<AdminOrder>(`/admin/orders/${id}`).then((r) => r.data),
};

/** Status order matches the lifecycle (TZ §9) — used for the filter dropdown. */
export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "COURIER_ASSIGNED",
  "ON_WAY",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Yangi",
  ACCEPTED: "Qabul qilindi",
  PREPARING: "Tayyorlanmoqda",
  READY: "Tayyor",
  COURIER_ASSIGNED: "Kuryer biriktirildi",
  ON_WAY: "Yo'lda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
  REJECTED: "Rad etildi",
};

type BadgeTone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";

export function orderStatusTone(status: OrderStatus): BadgeTone {
  switch (status) {
    case "PENDING":
      return "warning";
    case "ACCEPTED":
    case "PREPARING":
    case "READY":
      return "info";
    case "COURIER_ASSIGNED":
    case "ON_WAY":
      return "brand";
    case "DELIVERED":
      return "success";
    case "CANCELLED":
    case "REJECTED":
      return "danger";
    default:
      return "neutral";
  }
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
