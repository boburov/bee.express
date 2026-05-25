export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "bee_express_bot",
} as const;
