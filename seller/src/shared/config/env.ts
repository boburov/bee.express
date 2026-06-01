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
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "bee_express_bot",
  appName: "BeeExpress Seller",
} as const;
