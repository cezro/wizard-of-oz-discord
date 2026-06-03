export interface StandupWindow {
  windowStart: Date;
  windowEnd: Date;
}

/** Returns the current instant and a 24-hour lookback window in the given IANA timezone context. */
export function getStandupWindow(
  timezone = "Asia/Manila",
  now: Date = new Date(),
): StandupWindow {
  void timezone;
  const windowEnd = now;
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return { windowStart, windowEnd };
}

/** Formats a date for embed titles in the given IANA timezone. */
export function formatDateInTimezone(
  timezone: string,
  date: Date = new Date(),
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
