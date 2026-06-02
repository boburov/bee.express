/**
 * Weekly opening-hours schedule stored on `Store.openingHours` (Json).
 * Shape: `{ mon: { open: "09:00", close: "22:00" }, ... }`. A missing/null day
 * means closed that day. An empty/absent schedule means "always open" (the
 * seller hasn't set hours — only the manual `isOpen` flag gates them).
 *
 * Times are HH:MM and evaluated against the SERVER's local time (the VPS is
 * expected to run in Asia/Tashkent, matching the rest of the date logic).
 */
export interface DayHours {
  open: string;
  close: string;
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function isStoreOpenNow(openingHours: unknown, now: Date = new Date()): boolean {
  if (!openingHours || typeof openingHours !== 'object') return true;
  const map = openingHours as Record<string, unknown>;

  // No day entries at all → seller didn't set hours → treat as always open.
  const hasAny = DAY_KEYS.some((k) => map[k]);
  if (!hasAny) return true;

  const today = map[DAY_KEYS[now.getDay()]];
  if (!today || typeof today !== 'object') return false; // closed today

  const { open, close } = today as { open?: unknown; close?: unknown };
  if (typeof open !== 'string' || typeof close !== 'string') return false;

  const o = toMinutes(open);
  const c = toMinutes(close);
  if (o == null || c == null) return false;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  // Overnight window (e.g. 22:00 → 02:00): open if before close OR after open.
  if (c <= o) return nowMin >= o || nowMin < c;
  return nowMin >= o && nowMin < c;
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}
