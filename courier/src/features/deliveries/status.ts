import type { CourierOrderStatus, TransportType } from "./types";

export interface StatusMeta {
  label: string;
  tone: "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";
}

export const COURIER_STATUS_META: Record<CourierOrderStatus, StatusMeta> = {
  PENDING:          { label: "Kutilmoqda",     tone: "info" },
  ACCEPTED:         { label: "Qabul qilindi",  tone: "brand" },
  PREPARING:        { label: "Tayyorlanyapti", tone: "brand" },
  READY:            { label: "Tayyor",         tone: "accent" },
  COURIER_ASSIGNED: { label: "Qabul qildingiz", tone: "brand" },
  ON_WAY:           { label: "Yo'lda",         tone: "brand" },
  DELIVERED:        { label: "Yetkazildi",     tone: "success" },
  CANCELLED:        { label: "Bekor qilindi",  tone: "danger" },
  REJECTED:         { label: "Rad etildi",     tone: "danger" },
};

/**
 * Forward action a courier can fire from a given status — mirrors
 * server/src/courier/courier.service.ts → COURIER_TRANSITIONS.
 */
export const COURIER_ACTION: Partial<
  Record<CourierOrderStatus, { next: CourierOrderStatus; label: string }>
> = {
  COURIER_ASSIGNED: { next: "ON_WAY", label: "Mahsulotni oldim" },
  ON_WAY: { next: "DELIVERED", label: "Yetkazdim" },
};

export const TRANSPORT_LABELS: Record<TransportType, string> = {
  WALK: "Piyoda",
  BICYCLE: "Velosiped",
  MOTORBIKE: "Mototsikl",
  CAR: "Mashina",
  TRUCK: "Yuk mashinasi",
};

export const TRANSPORT_OPTIONS: { value: TransportType; label: string }[] = (
  Object.keys(TRANSPORT_LABELS) as TransportType[]
).map((value) => ({ value, label: TRANSPORT_LABELS[value] }));

/** Build a Yandex Maps pin/route deeplink for a coordinate pair. */
export function yandexPin(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `https://yandex.uz/maps/?ll=${lng},${lat}&z=17&pt=${lng},${lat}`;
}

/**
 * Google Maps directions deeplink in the path form `/maps/dir/<origin>/<dest>`
 * (no API key, no session tokens). Google plots the route immediately:
 *   origin = courier's live GPS, destination = customer's coords.
 * When origin is absent the empty segment makes Google use the device location.
 * We deliberately drop the volatile `data=`/`g_ep=` viewport/session params —
 * they expire and would rot a hardcoded link.
 */
export function googleMapsDir(
  destLat: number | null,
  destLng: number | null,
  origin?: { lat: number; lng: number } | null,
): string | null {
  if (destLat == null || destLng == null) return null;
  const orig = origin ? `${origin.lat},${origin.lng}` : "";
  return `https://www.google.com/maps/dir/${orig}/${destLat},${destLng}`;
}
