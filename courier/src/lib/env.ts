/**
 * Public runtime config inlined into the browser bundle.
 *
 * The API URL is hardcoded here so the app works without any .env file. A
 * `NEXT_PUBLIC_*` env var still overrides the default when one is provided.
 */
export const env = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.beexpress.uz/api",
  botUsername:
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "BeeExpressBot",
  // Google Maps Embed API key — powers the in-app directions <iframe>. Free
  // (no per-load billing), but must exist for the embedded map to render;
  // without it the page falls back to the offline Leaflet route map.
  mapsEmbedKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? "",
  appName: "BeeExpress Courier",
} as const;
