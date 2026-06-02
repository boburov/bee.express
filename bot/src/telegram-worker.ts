import { InlineKeyboard, type Bot } from "grammy";
import { TG_NOTIFY_QUEUE, type TgNotifyJob } from "./queue";
import { tgBlockingRedis } from "./redis";

/**
 * Long-running worker that BLPOPs order/notification jobs from Redis and
 * delivers them via Telegram. Runs beside runOtpWorker on its OWN blocking
 * connection (ioredis serializes per connection). Plain-text messages — the
 * payload is already a localized title+body, no HTML.
 */
export async function runTelegramWorker(bot: Bot, signal: AbortSignal): Promise<void> {
  console.log(`[tg-worker] started, listening on ${TG_NOTIFY_QUEUE}`);

  while (!signal.aborted) {
    let popped: [string, string] | null;
    try {
      popped = await tgBlockingRedis.blpop(TG_NOTIFY_QUEUE, 5);
    } catch (err) {
      if (signal.aborted) break;
      console.error(`[tg-worker] BLPOP failed: ${(err as Error).message}`);
      await sleep(1000);
      continue;
    }
    if (!popped) continue;

    const [, raw] = popped;
    let job: TgNotifyJob;
    try {
      job = JSON.parse(raw) as TgNotifyJob;
    } catch {
      console.error(`[tg-worker] dropping malformed payload: ${raw.slice(0, 200)}`);
      continue;
    }

    try {
      const replyMarkup = job.deepLink
        ? new InlineKeyboard().url("Buyurtmani ko'rish", job.deepLink)
        : undefined;
      await bot.api.sendMessage(
        Number(job.telegramId),
        job.text,
        replyMarkup ? { reply_markup: replyMarkup } : undefined,
      );
      console.log(`[tg-worker] delivered requestId=${job.requestId} chat=${job.telegramId}`);
    } catch (err) {
      const desc = (err as { description?: string }).description ?? (err as Error).message;
      console.error(`[tg-worker] delivery failed requestId=${job.requestId}: ${desc}`);
      // No requeue — the in-app /notifications row is the source of truth.
    }
  }

  console.log("[tg-worker] stopped");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
