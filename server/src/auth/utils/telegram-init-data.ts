import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface VerifiedInitData {
  user: TelegramUser;
  authDate: Date;
  queryId?: string;
  raw: Record<string, string>;
}

export class InvalidInitDataError extends Error {
  constructor(reason: string) {
    super(`Invalid Telegram initData: ${reason}`);
  }
}

/**
 * Verify Telegram Mini App initData per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * secret_key = HMAC_SHA256(key="WebAppData", message=bot_token)
 * data_check_string = sorted("<k>=<v>\n...") excluding "hash"
 * expected_hash = HMAC_SHA256(secret_key, data_check_string).hex()
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 24 * 60 * 60,
): VerifiedInitData {
  if (!initData) throw new InvalidInitDataError('empty');
  if (!botToken) throw new InvalidInitDataError('bot token not configured');

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new InvalidInitDataError('missing hash');

  const entries: [string, string][] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') entries.push([key, value]);
  });
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(hash, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new InvalidInitDataError('hash mismatch');
  }

  const authDateRaw = params.get('auth_date');
  if (!authDateRaw) throw new InvalidInitDataError('missing auth_date');
  const authDateSec = Number(authDateRaw);
  if (!Number.isFinite(authDateSec)) throw new InvalidInitDataError('bad auth_date');
  const ageSec = Math.floor(Date.now() / 1000) - authDateSec;
  if (ageSec > maxAgeSeconds) throw new InvalidInitDataError('expired');

  const userRaw = params.get('user');
  if (!userRaw) throw new InvalidInitDataError('missing user');
  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw) as TelegramUser;
  } catch {
    throw new InvalidInitDataError('user not parseable');
  }
  if (typeof user.id !== 'number') throw new InvalidInitDataError('bad user.id');

  const raw: Record<string, string> = {};
  params.forEach((v, k) => (raw[k] = v));

  return {
    user,
    authDate: new Date(authDateSec * 1000),
    queryId: params.get('query_id') ?? undefined,
    raw,
  };
}

/** Stable fingerprint of initData, for audit logs (avoids storing the full string). */
export function initDataFingerprint(initData: string): string {
  return createHash('sha256').update(initData).digest('hex').slice(0, 16);
}
