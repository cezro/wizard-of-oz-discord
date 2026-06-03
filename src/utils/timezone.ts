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

/** Nudge time; null nudge_hour falls back to summary_hour. */
export function resolveNudgeSchedule(target: {
  nudgeHour: number | null;
  nudgeMinute: number;
  summaryHour: number;
}): { hour: number; minute: number } {
  return {
    hour: target.nudgeHour ?? target.summaryHour,
    minute: target.nudgeMinute,
  };
}

const DATE_STRING_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface ResolvedSummarizeDate {
  dateString: string;
  usedFallback: boolean;
}

/** Validates YYYY-MM-DD and that it is a real calendar date. */
export function isValidDateString(s: string): boolean {
  if (!DATE_STRING_RE.test(s)) return false;
  const [year, month, day] = s.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

/** Resolves summarize date: option, else today; invalid option falls back to today. */
export function resolveSummarizeDate(
  timezone: string,
  dateOption?: string,
  now: Date = new Date(),
): ResolvedSummarizeDate {
  validateTimezone(timezone);
  const today = getLocalTimeParts(timezone, now).dateString;

  if (!dateOption?.trim()) {
    return { dateString: today, usedFallback: false };
  }

  const trimmed = dateOption.trim();
  if (isValidDateString(trimmed)) {
    return { dateString: trimmed, usedFallback: false };
  }

  return { dateString: today, usedFallback: true };
}

/** Inclusive calendar-day window in the given IANA timezone. */
export function getCalendarDayWindow(
  timezone: string,
  dateString: string,
): StandupWindow {
  validateTimezone(timezone);
  if (!isValidDateString(dateString)) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  return {
    windowStart: zonedLocalTimeToUtc(timezone, dateString, 0, 0, 0, 0),
    windowEnd: zonedLocalTimeToUtc(timezone, dateString, 23, 59, 59, 999),
  };
}

/** Reference instant for embed titles (local noon on that day). */
export function dateStringToReferenceDate(
  timezone: string,
  dateString: string,
): Date {
  validateTimezone(timezone);
  if (!isValidDateString(dateString)) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return zonedLocalTimeToUtc(timezone, dateString, 12, 0, 0, 0);
}

function zonedLocalTimeToUtc(
  timeZone: string,
  dateString: string,
  hour: number,
  minute: number,
  second: number,
  ms: number,
): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  let utc = Date.UTC(year, month - 1, day, hour, minute, second, ms);

  for (let i = 0; i < 3; i++) {
    const offset = getTimezoneOffsetMs(timeZone, new Date(utc));
    const corrected = Date.UTC(year, month - 1, day, hour, minute, second, ms) - offset;
    if (corrected === utc) break;
    utc = corrected;
  }

  return new Date(utc);
}

function getTimezoneOffsetMs(timeZone: string, date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value]),
  );

  let hour = parseInt(parts.hour ?? "0", 10);
  if (hour === 24) hour = 0;

  const asUtc = Date.UTC(
    parseInt(parts.year ?? "0", 10),
    parseInt(parts.month ?? "1", 10) - 1,
    parseInt(parts.day ?? "1", 10),
    hour,
    parseInt(parts.minute ?? "0", 10),
    parseInt(parts.second ?? "0", 10),
  );

  return asUtc - date.getTime();
}
