import type { Bot } from "grammy";
import { formatPhone } from "./phone";
import { OTP_SEND_QUEUE, type OtpSendJob } from "./queue";
import { blockingRedis } from "./redis";

/**
 * Long-running worker that BLPOPs OTP jobs from Redis and delivers them via Telegram.
 * One worker per process is enough — grammy/Bot API is rate-limited but a single
 * connection saturates well below Telegram's per-chat caps for OTP traffic.
 */
export async function runOtpWorker(bot: Bot, signal: AbortSignal): Promise<void> {
  console.log(`[otp-worker] started, listening on ${OTP_SEND_QUEUE}`);

  while (!signal.aborted) {
    let popped: [string, string] | null;
    try {
      // 5s timeout so we can periodically observe the abort signal
      popped = await blockingRedis.blpop(OTP_SEND_QUEUE, 5);
    } catch (err) {
      if (signal.aborted) break;
      console.error(`[otp-worker] BLPOP failed: ${(err as Error).message}`);
      await sleep(1000);
      continue;
    }
    if (!popped) continue;

    const [, raw] = popped;
    let job: OtpSendJob;
    try {
      job = JSON.parse(raw) as OtpSendJob;
    } catch {
      console.error(`[otp-worker] dropping malformed payload: ${raw.slice(0, 200)}`);
      continue;
    }

    await deliver(bot, job);
  }

  console.log("[otp-worker] stopped");
}

async function deliver(bot: Bot, job: OtpSendJob): Promise<void> {
  const phoneFormatted = formatPhone(BigInt(job.phone));
  const text =
    `🔐 BeeExpress tasdiqlash kodi:\n\n` +
    `<code>${job.code}</code>\n\n` +
    `Telefon: ${phoneFormatted}\n` +
    `Amal qilish muddati: ${job.ttlSeconds} soniya.\n\n` +
    `Bu kodni hech kim bilan ulashmang.`;

  try {
    await bot.api.sendMessage(Number(job.telegramId), text, { parse_mode: "HTML" });
    console.log(`[otp-worker] delivered requestId=${job.requestId} chat=${job.telegramId}`);
  } catch (err) {
    const desc = (err as { description?: string }).description ?? (err as Error).message;
    console.error(`[otp-worker] delivery failed requestId=${job.requestId}: ${desc}`);
    // We intentionally do not requeue — OTPs are short-lived. Users can request a new code.
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
