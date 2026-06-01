import type { Prisma } from '@prisma/client';

/** Earth's radius in km — used by haversine. */
const EARTH_RADIUS_KM = 6371;

/**
 * Final fallback FOOD service radius (km) — used when neither the store nor its
 * category set `deliveryRadiusKm`. Keeps the historical 10 km default.
 */
export const DEFAULT_FOOD_RADIUS_KM = 10;

/**
 * Hard cap on a store's service radius — mirrors CreateStoreDto `@Max(100)`.
 * When a buyer supplies no `radiusKm`, we must scan at least this far in the
 * bounding-box pre-filter so we don't drop a far store whose own (large) radius
 * still reaches the buyer.
 */
export const MAX_FOOD_RADIUS_KM = 100;

/**
 * The radius (km) within which a FOOD store actually serves a buyer. The
 * store's own override wins, then the category default, then the global
 * fallback. This is the single gate for "do I see this store at all?" — applied
 * identically at browse time (list/nearby) and on the product detail page.
 */
export function effectiveFoodRadiusKm(
  storeRadiusKm: number | null | undefined,
  categoryRadiusKm: number | null | undefined,
): number {
  return storeRadiusKm ?? categoryRadiusKm ?? DEFAULT_FOOD_RADIUS_KM;
}

/**
 * Great-circle distance in **kilometres** between two WGS-84 points.
 * Off-by-tens-of-metres for typical city deliveries; cheap and dependency-free.
 *
 * For an MVP this is well-within the noise floor of OSM/Yandex routing
 * estimates we'll later overlay. Replace with a routing-service call if
 * exact-road-distance becomes a billing input.
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Quick bounding-box pre-filter. Generates a `where` snippet that picks any
 * point within ~radiusKm of (lat, lng). Apply this in SQL (index-friendly)
 * before running an exact haversine refine in JS — this is the standard
 * "filter then refine" trick when the DB has no native geo support.
 *
 * Returns `null` if anchor is missing (caller should fall back to no filter).
 */
export function boundingBox(
  lat: number,
  lng: number,
  radiusKm: number,
): { latMin: number; latMax: number; lngMin: number; lngMax: number } {
  // 1° latitude ≈ 111 km; longitude shrinks by cos(lat) towards the poles.
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.000001));
  return {
    latMin: lat - dLat,
    latMax: lat + dLat,
    lngMin: lng - dLng,
    lngMax: lng + dLng,
  };
}

/** Helper to translate a Decimal? from Prisma to a primitive number. */
export function decimalToNumber(v: Prisma.Decimal | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return typeof v === 'number' ? v : Number(v.toString());
}

/**
 * Compute a delivery fee given:
 *   - distance in km
 *   - the store's overrides (nullable)
 *   - the product's category defaults (nullable)
 *
 * Returns `null` when neither side has a usable fee schedule — callers must
 * treat this as "delivery not configured" rather than free.
 *
 * Formula: baseFee + perKmFee × distanceKm, rounded to the nearest 100 so'm.
 */
export function computeDeliveryFee(
  distanceKm: number,
  storeOverride: { baseFee: number | null; perKmFee: number | null } | null,
  categoryDefault: { baseFee: number | null; perKmFee: number | null } | null,
): number | null {
  const base = storeOverride?.baseFee ?? categoryDefault?.baseFee ?? null;
  const perKm = storeOverride?.perKmFee ?? categoryDefault?.perKmFee ?? null;
  if (base === null || perKm === null) return null;
  const raw = base + perKm * Math.max(0, distanceKm);
  return Math.round(raw / 100) * 100;
}
