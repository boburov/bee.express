const SUM_FORMATTER = new Intl.NumberFormat("uz-UZ");

export function formatSum(value: number | string | bigint | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${SUM_FORMATTER.format(n)} so'm`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return SUM_FORMATTER.format(value);
}

export function formatDistance(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return "—";
  return `${km.toFixed(1)} km`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_FORMATTER.format(d);
}

const DATETIME_FORMATTER = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return DATETIME_FORMATTER.format(d);
}

/** "+998 99 341 17 86" — UZ phone format from raw digits. */
export function formatPhoneNumber(phone?: string | number | bigint | null): string {
  if (phone == null) return "—";
  const s = String(phone);
  if (s.length < 9) return s;
  const last = s.slice(-9);
  return `+998 ${last.slice(0, 2)} ${last.slice(2, 5)} ${last.slice(5, 7)} ${last.slice(7)}`;
}
