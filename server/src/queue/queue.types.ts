export const OTP_SEND_QUEUE = 'beex:otp:send';

export interface OtpSendJob {
  telegramId: string;
  phone: string;
  code: string;
  ttlSeconds: number;
  requestId: string;
  enqueuedAt: number;
}
