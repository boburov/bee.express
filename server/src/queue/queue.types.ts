export const OTP_SEND_QUEUE = 'beex:otp:send';

export interface OtpSendJob {
  telegramId: string;
  phone: string;
  code: string;
  ttlSeconds: number;
  requestId: string;
  enqueuedAt: number;
}

/** Order/notification → Telegram push queue (mirrors the OTP queue). */
export const TG_NOTIFY_QUEUE = 'beex:tg:notify';

export interface TgNotifyJob {
  telegramId: string;
  text: string;
  link?: string;
  /** Absolute HTTPS URL to open the order in the right mini app (button). */
  deepLink?: string;
  notificationId?: string;
  requestId: string;
  enqueuedAt: number;
}
