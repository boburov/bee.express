export const OTP_SEND_QUEUE = "beex:otp:send";

export interface OtpSendJob {
  telegramId: string;
  phone: string;
  code: string;
  ttlSeconds: number;
  requestId: string;
  enqueuedAt: number;
}

/** Mirrors server/src/queue/queue.types.ts — order/notification Telegram push. */
export const TG_NOTIFY_QUEUE = "beex:tg:notify";

export interface TgNotifyJob {
  telegramId: string;
  text: string;
  link?: string;
  notificationId?: string;
  requestId: string;
  enqueuedAt: number;
}
