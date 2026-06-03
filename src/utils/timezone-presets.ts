export const DEFAULT_TIMEZONE = "Asia/Manila";

export interface TimezonePresetOption {
  label: string;
  value: string;
}

/** Discord string-select menus allow at most 25 options. */
export const TIMEZONE_PRESET_OPTIONS: TimezonePresetOption[] = [
  { label: "Asia/Manila (Philippines)", value: "Asia/Manila" },
  { label: "UTC", value: "UTC" },
  { label: "America/Los Angeles", value: "America/Los_Angeles" },
  { label: "America/Denver", value: "America/Denver" },
  { label: "America/Chicago", value: "America/Chicago" },
  { label: "America/New York", value: "America/New_York" },
  { label: "America/Toronto", value: "America/Toronto" },
  { label: "America/Sao Paulo", value: "America/Sao_Paulo" },
  { label: "Europe/London", value: "Europe/London" },
  { label: "Europe/Paris", value: "Europe/Paris" },
  { label: "Europe/Berlin", value: "Europe/Berlin" },
  { label: "Europe/Amsterdam", value: "Europe/Amsterdam" },
  { label: "Asia/Dubai", value: "Asia/Dubai" },
  { label: "Asia/Kolkata", value: "Asia/Kolkata" },
  { label: "Asia/Singapore", value: "Asia/Singapore" },
  { label: "Asia/Hong Kong", value: "Asia/Hong_Kong" },
  { label: "Asia/Tokyo", value: "Asia/Tokyo" },
  { label: "Asia/Seoul", value: "Asia/Seoul" },
  { label: "Australia/Sydney", value: "Australia/Sydney" },
  { label: "Australia/Melbourne", value: "Australia/Melbourne" },
  { label: "Pacific/Auckland", value: "Pacific/Auckland" },
  { label: "Pacific/Honolulu", value: "Pacific/Honolulu" },
];

const PRESET_VALUES = new Set(
  TIMEZONE_PRESET_OPTIONS.map((option) => option.value),
);

export function isKnownTimezonePreset(value: string): boolean {
  return PRESET_VALUES.has(value);
}

export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function invalidTimezoneMessage(timezone: string): string {
  return `Invalid timezone \`${timezone}\`. Use an IANA name like \`Asia/Manila\`.`;
}
