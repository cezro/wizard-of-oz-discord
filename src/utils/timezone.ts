export interface StandupWindow {
  windowStart: Date;
  windowEnd: Date;
}

/** Validates an IANA timezone string; throws if invalid. */
export function validateTimezone(timezone: string): void {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    throw new Error(`Invalid IANA timezone: ${timezone}`);
  }
}

export function isWithinWindow(date: Date, window: StandupWindow): boolean {
  return date >= window.windowStart && date <= window.windowEnd;
}

/** Returns an inclusive rolling 24-hour window anchored to the execution instant. */
export function getStandupWindow(
  timezone = "Asia/Manila",
  now: Date = new Date(),
): StandupWindow {
  validateTimezone(timezone);
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
