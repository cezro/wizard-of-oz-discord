export interface StandupWindow {
  windowStart: Date;
  windowEnd: Date;
}

export interface LocalTimeParts {
  hour: number;
  minute: number;
  dateString: string;
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

/** Current local hour, minute, and YYYY-MM-DD in the given IANA timezone. */
export function getLocalTimeParts(
  timezone: string,
  now: Date = new Date(),
): LocalTimeParts {
  validateTimezone(timezone);

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "0";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hour = parseInt(get("hour"), 10);
  const minute = parseInt(get("minute"), 10);

  // en-CA hour12:false can emit "24" at midnight in some runtimes
  if (hour === 24) hour = 0;

  return {
    hour,
    minute,
    dateString: `${year}-${month}-${day}`,
  };
}

export function matchesSchedule(
  hour: number,
  minute: number,
  targetHour: number,
  targetMinute: number,
): boolean {
  return hour === targetHour && minute === targetMinute;
}

export function formatScheduleTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
