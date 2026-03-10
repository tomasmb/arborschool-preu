/**
 * Shared date helpers for week-based calculations.
 * Used by journey state, missions, analytics, and streak tracking.
 *
 * Weeks start on Monday (ISO standard).
 */

export function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Monday of the current ISO week (UTC). */
export function currentWeekStartDate(reference = new Date()): string {
  const utc = new Date(
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth(),
      reference.getUTCDate()
    )
  );
  const day = utc.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - daysFromMonday);
  return toDateOnly(utc);
}

/** Monday–Sunday range of the current ISO week (UTC). */
export function getCurrentWeekRange(reference = new Date()): {
  weekStartDate: string;
  weekEndDate: string;
} {
  const utc = new Date(
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth(),
      reference.getUTCDate()
    )
  );

  const day = utc.getUTCDay();
  const daysFromMonday = (day + 6) % 7;

  const start = new Date(utc);
  start.setUTCDate(start.getUTCDate() - daysFromMonday);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return {
    weekStartDate: toDateOnly(start),
    weekEndDate: toDateOnly(end),
  };
}
