import type { OrderStatus } from "./types";

export interface StatusMeta {
  label: string;
  tone: "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";
}

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

/**
 * Allowed forward transitions from the seller side — mirrors
 * server/src/orders/orders.service.ts → SELLER_TRANSITIONS.
 *
 * From READY the seller may still self-deliver (READY → ON_WAY), but once a
 * courier claims the order it becomes COURIER_ASSIGNED and the seller has no
 * further moves — the courier panel drives it to DELIVERED.
 */
export const SELLER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:          ["ACCEPTED", "REJECTED"],
  ACCEPTED:         ["PREPARING", "CANCELLED"],
  PREPARING:        ["READY", "CANCELLED"],
  READY:            ["ON_WAY", "CANCELLED"],
  COURIER_ASSIGNED: [],
  ON_WAY:           ["DELIVERED"],
  DELIVERED:        [],
  CANCELLED:        [],
  REJECTED:         [],
};
