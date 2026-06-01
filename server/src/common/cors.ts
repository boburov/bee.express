/**
 * Single source of truth for CORS, shared by the REST app (main.ts) and the
 * Socket.IO gateway (notifications.gateway.ts).
 *
 * `CORS_ORIGINS` is a comma-separated allow-list, e.g.
 *   CORS_ORIGINS=https://admin.example.uz,https://seller.example.uz
 *
 * When it's unset we DON'T fall back to "reflect any origin" in production —
 * that (with credentials) is a CSRF/session-theft vector. Prod with no list =
 * deny cross-origin; dev with no list = reflect (convenient for localhost).
 */
export function corsOrigins(): string[] | boolean {
  const raw = process.env.CORS_ORIGINS;
  if (raw && raw.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return process.env.NODE_ENV === 'production' ? false : true;
}

export function corsOptions() {
  return { origin: corsOrigins(), credentials: true };
}
