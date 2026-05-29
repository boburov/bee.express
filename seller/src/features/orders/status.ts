import type { OrderStatus } from "./types";

export interface StatusMeta {
  label: string;
  tone: "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING:   { label: "Kutilmoqda",     tone: "info" },
  ACCEPTED:  { label: "Qabul qilindi",  tone: "brand" },
  PREPARING: { label: "Tayyorlanyapti", tone: "brand" },
  READY:     { label: "Tayyor",         tone: "brand" },
  ON_WAY:    { label: "Yo'lda",         tone: "brand" },
  DELIVERED: { label: "Yetkazildi",     tone: "success" },
  CANCELLED: { label: "Bekor qilindi",  tone: "danger" },
  REJECTED:  { label: "Rad etildi",     tone: "danger" },
};

export const ORDER_STATUS_LIST: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ON_WAY",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
];

/**
 * Allowed forward transitions from the seller side — mirrors
 * server/src/orders/orders.service.ts → SELLER_TRANSITIONS.
 */
export const SELLER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ["ACCEPTED", "REJECTED"],
  ACCEPTED:  ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY:     ["ON_WAY", "CANCELLED"],
  ON_WAY:    ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED:  [],
};
