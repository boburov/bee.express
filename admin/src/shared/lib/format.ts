/**
 * Display formatters. All UI-facing numbers/dates/phones go through here so
 * locale changes are one-edit. Keep these pure; no React.
 */

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

const DATE_FORMATTER = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_FORMATTER.format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return DATETIME_FORMATTER.format(d);
}

export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D+/g, "");
  if (digits.length !== 12 || !digits.startsWith("998")) return raw;
  const a = digits.slice(3, 5);
  const b = digits.slice(5, 8);
  const c = digits.slice(8, 10);
  const d = digits.slice(10, 12);
  return `+998 ${a} ${b} ${c} ${d}`;
}
