import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export const config = {
  botToken: required("TELEGRAM_BOT_TOKEN"),
  botUsername: process.env.TELEGRAM_BOT_USERNAME ?? "BeeExpressBot",
  miniAppUrl: process.env.MINI_APP_URL ?? "",
  databaseUrl: required("DATABASE_URL"),
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
};
