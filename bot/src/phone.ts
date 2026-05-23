// Keep in sync with server/src/auth/utils/phone.ts
const UZ_MOBILE_PREFIXES = [
  "20",
  "33", "50", "55", "77", "88",
  "90", "91", "93", "94", "95", "97", "98", "99",
];

export class InvalidPhoneError extends Error {
  constructor(public readonly input: string) {
    super(`Invalid Uzbek phone number: "${input}"`);
  }
}

export function normalizePhone(input: string): bigint {
  if (typeof input !== "string") throw new InvalidPhoneError(String(input));
  let digits = input.replace(/\D+/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  if (digits.length !== 9) throw new InvalidPhoneError(input);
  const prefix = digits.slice(0, 2);
  if (!UZ_MOBILE_PREFIXES.includes(prefix)) throw new InvalidPhoneError(input);
  return BigInt(digits);
}

export function formatPhone(phone: bigint): string {
  // negative phones are placeholders (set by Mini App auth when phone unknown)
  const abs = phone < 0n ? -phone : phone;
  const digits = abs.toString().padStart(9, "0");
  return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
}
