/**
 * Parse a date of birth from either MM/DD/YYYY (what the voice agent collects)
 * or YYYY-MM-DD (ISO, convenient for REST clients) into a canonical
 * YYYY-MM-DD string suitable for a Postgres `date` column.
 *
 * Rejects: malformed strings, impossible calendar dates (e.g. 02/30/2020),
 * and any date in the future. Returns null on any failure.
 */
export function parseDob(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();

  let year: number, month: number, day: number;

  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);

  if (mdy) {
    month = Number(mdy[1]);
    day = Number(mdy[2]);
    year = Number(mdy[3]);
  } else if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    return null;
  }

  // Construct as UTC and verify the components round-trip, which catches
  // overflow like 02/30 (JS would roll it into March).
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  // Not in the future (compared against today's UTC date).
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  if (date.getTime() > todayUtc) return null;

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}
