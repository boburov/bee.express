import type { OrderStatus } from "./types";

export interface StatusMeta {
  label: string;
  tone: "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";
}

/**
 * Status label + Badge tone mapping. PENDING is treated as "info" (waiting),
 * ACCEPTED/PREPARING/READY/ON_WAY are progressive "brand" (in motion),
 * DELIVERED is "success", CANCELLED/REJECTED are "danger".
 */
export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING:          { label: "Kutilmoqda",     tone: "info" },
  ACCEPTED:         { label: "Qabul qilindi",  tone: "brand" },
  PREPARING:        { label: "Tayyorlanyapti", tone: "brand" },
  READY:            { label: "Tayyor",         tone: "brand" },
  COURIER_ASSIGNED: { label: "Kuryer topildi", tone: "brand" },
  ON_WAY:           { label: "Yo'lda",         tone: "brand" },
  DELIVERED:        { label: "Yetkazildi",     tone: "success" },
  CANCELLED:        { label: "Bekor qilindi",  tone: "danger" },
  REJECTED:         { label: "Rad etildi",     tone: "danger" },
};

/** Ordered list (for filter dropdowns). */
export const ORDER_STATUS_LIST: OrderStatus[] = [
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
