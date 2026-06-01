/**
 * Single source of truth for CORS, shared by the REST app (main.ts) and the
 * Socket.IO gateway (notifications.gateway.ts).
 *
 * `CORS_ORIGINS` is a comma-separated allow-list, e.g.
 *   CORS_ORIGINS=https://admin.example.uz,https://seller.example.uz
 *
 * When it's unset we DON'T fall back to "reflect any origin" in production —
 * that (with credentials) is a CSRF/session-theft vector. Prod with no list =
 * allow only ALWAYS_ALLOWED_ORIGINS; dev with no list = reflect (convenient
 * for localhost).
 *
 * ALWAYS_ALLOWED_ORIGINS are trusted production frontends baked into the code
 * so they keep working after a deploy without per-server .env edits
 * (server/.env is gitignored and lives only on the host). They are always
 * merged into the allow-list. Note: the browser's `Origin` header has no
 * trailing slash and no path — list the scheme+host only.
 */
const ALWAYS_ALLOWED_ORIGINS = ['https://bee-express.vercel.app'];

export function corsOrigins(): string[] | boolean {
  const raw = process.env.CORS_ORIGINS;
  const fromEnv =
    raw && raw.trim()
      ? raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  // Dev with no explicit list: reflect any origin (convenient for localhost).
  if (fromEnv.length === 0 && process.env.NODE_ENV !== 'production') {
    return true;
  }

  // Otherwise an explicit allow-list: env entries + always-trusted frontends.
  return [...new Set([...fromEnv, ...ALWAYS_ALLOWED_ORIGINS])];
}

export function corsOptions() {
  return { origin: corsOrigins(), credentials: true };
}
