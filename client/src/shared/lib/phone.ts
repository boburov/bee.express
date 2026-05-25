/** Strip non-digits and remove a leading 998 if present. Returns the 9-digit core. */
export function normalizePhoneInput(input: string): string {
  let digits = input.replace(/\D+/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  return digits.slice(0, 9);
}

/** Format a 9-digit core as "+998 99 341 17 86" for display. Partial input is fine. */
export function formatPhone(core: string): string {
  if (!core) return "+998 ";
  const d = core.padEnd(9, "•");
  const parts: string[] = ["+998", d.slice(0, 2)];
  if (core.length > 2) parts.push(d.slice(2, 5));
  if (core.length > 5) parts.push(d.slice(5, 7));
  if (core.length > 7) parts.push(d.slice(7, 9));
  return parts.join(" ").replaceAll("•", "");
}
