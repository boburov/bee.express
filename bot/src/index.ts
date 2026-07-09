import { createBot } from "./bot";
import { config } from "./config";
import { prisma } from "./db";
import { runOtpWorker } from "./otp-worker";
import { runTelegramWorker } from "./telegram-worker";
import { blockingRedis, redis, tgBlockingRedis } from "./redis";

async function main(): Promise<void> {
  const bot = createBot();
  const abort = new AbortController();

  await prisma.$connect();
  console.log("[db] connected");

  // Botning pastdagi menu tugmasini ("Open App") to'g'ridan-to'g'ri Mini App'ga ulash
  if (config.miniAppUrl) {
    try {
      await bot.api.setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: "🐝 BeeExpress",
          web_app: { url: config.miniAppUrl },
        },
      });
      console.log(`[bot] menu button -> ${config.miniAppUrl}`);
    } catch (err) {
      console.error(`[bot] setChatMenuButton failed: ${(err as Error).message}`);
    }
  }

  bot.start({
    onStart: (info) => console.log(`[bot] @${info.username} online (long polling)`),
  }).catch((err) => {
    console.error(`[bot] polling stopped: ${(err as Error).message}`);
    abort.abort();
  });

  const workerDone = runOtpWorker(bot, abort.signal);
  const tgWorkerDone = runTelegramWorker(bot, abort.signal);

  const shutdown = async (sig: string) => {
    console.log(`\n[main] ${sig} received — shutting down`);
    abort.abort();
    try {
      await bot.stop();
    } catch {
      /* already stopped */
    }
    await workerDone.catch(() => undefined);
    await tgWorkerDone.catch(() => undefined);
    await Promise.allSettled([
      prisma.$disconnect(),
      redis.quit(),
      blockingRedis.quit(),
      tgBlockingRedis.quit(),
    ]);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  console.log(`[main] bot started; miniApp=${config.miniAppUrl || "(not set)"}`);
}

main().catch((err) => {
  console.error("[main] fatal:", err);
  process.exit(1);
});
