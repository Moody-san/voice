/**
 * Normalize free-form phone input to a canonical 10-digit US number.
 *
 * Callers (and the voice agent) may say "(415) 555-0132", "415-555-0132",
 * "+1 415 555 0132", etc. We strip formatting, drop a leading country code 1,
 * and enforce the NANP rule that the area-code and exchange first digits are
 * 2-9 (so "111", "011", 3-digit fragments, etc. are rejected).
 *
 * @returns the 10-digit string when valid, otherwise null.
 */
export function normalizeUsPhone(input: unknown): string | null {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  let digits = String(input).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) return null;
  // NANP: area code and central-office code both start 2-9.
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return null;
  return digits;
}
