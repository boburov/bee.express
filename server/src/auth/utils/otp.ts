import { randomInt } from 'node:crypto';

export function generateOtpCode(length = 6): string {
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, '0');
}

export function otpExpiresAt(ttlSeconds: number): Date {
  return new Date(Date.now() + ttlSeconds * 1000);
}
