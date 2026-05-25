/** Strip non-digit chars and clamp to 9 digits (Uzbek phone without +998 prefix). */
export function normalizePhoneInput(input: string): string {
  return input.replace(/\D+/g, "").slice(0, 9);
}

/** 993411786 → +998 99 341 17 86 */
export function formatPhone(phone: string): string {
  if (!phone || phone.length < 9) return phone;
  const last = phone.slice(-9);
  return `+998 ${last.slice(0, 2)} ${last.slice(2, 5)} ${last.slice(5, 7)} ${last.slice(7)}`;
}
