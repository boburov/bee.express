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
