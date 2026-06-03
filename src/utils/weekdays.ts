import { validateTimezone } from "./timezone.js";

/** JS Date.getDay() values: 0 = Sunday … 6 = Saturday. */
export const DEFAULT_ACTIVE_WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5];

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const DAY_ALIASES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const INTL_WEEKDAY_TO_JS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type ParseActiveWeekdaysResult =
  | { ok: true; weekdays: number[] }
  | { ok: false; error: string };

export function normalizeActiveWeekdays(
  weekdays: number[] | null | undefined,
): number[] {
  if (!weekdays || weekdays.length === 0) {
    return [...DEFAULT_ACTIVE_WEEKDAYS];
  }
  return [...new Set(weekdays)].sort((a, b) => a - b);
}

export function parseActiveWeekdays(
  input?: string | null,
): ParseActiveWeekdaysResult {
  const trimmed = input?.trim().toLowerCase();

  if (!trimmed || trimmed === "weekdays") {
    return { ok: true, weekdays: [...DEFAULT_ACTIVE_WEEKDAYS] };
  }
  if (trimmed === "all" || trimmed === "everyday") {
    return { ok: true, weekdays: [0, 1, 2, 3, 4, 5, 6] };
  }
  if (trimmed === "weekend") {
    return { ok: true, weekdays: [0, 6] };
  }

  const parts = trimmed.split(/[,\s]+/).filter(Boolean);
  const days = new Set<number>();

  for (const part of parts) {
    const day = DAY_ALIASES[part];
    if (day === undefined) {
      return {
        ok: false,
        error: `Unknown day \`${part}\`. Use names like \`mon\`, \`tue\`, or presets \`weekdays\`, \`weekend\`, \`all\`.`,
      };
    }
    days.add(day);
  }

  if (days.size === 0) {
    return {
      ok: false,
      error: "Specify at least one day (e.g. `mon,tue,wed,thu,fri`).",
    };
  }

  return { ok: true, weekdays: [...days].sort((a, b) => a - b) };
}

export function formatActiveWeekdays(weekdays: number[]): string {
  const normalized = normalizeActiveWeekdays(weekdays);
  return normalized.map((d) => WEEKDAY_SHORT[d] ?? String(d)).join(", ");
}

export function getLocalWeekday(
  timezone: string,
  now: Date = new Date(),
): number {
  validateTimezone(timezone);
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(now);
  const day = INTL_WEEKDAY_TO_JS[label];
  if (day === undefined) {
    throw new Error(`Unexpected weekday label: ${label}`);
  }
  return day;
}

export function isActiveWeekday(
  activeWeekdays: number[],
  timezone: string,
  now: Date = new Date(),
): boolean {
  const normalized = normalizeActiveWeekdays(activeWeekdays);
  return normalized.includes(getLocalWeekday(timezone, now));
}
