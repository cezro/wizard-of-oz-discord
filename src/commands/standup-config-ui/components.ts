export const ACTION_ROW = 1;
export const BUTTON = 2;
export const STRING_SELECT = 3;
export const ROLE_SELECT = 6;
export const CHANNEL_SELECT = 8;

export const BTN_PRIMARY = 1;
export const BTN_SECONDARY = 2;
export const BTN_SUCCESS = 3;
export const BTN_DANGER = 4;

export const EMBED_COLOR = 0x5865f2;
export const EMBED_COLOR_OK = 0x57f287;

export type SelectOption = {
  label: string;
  value: string;
  default?: boolean;
};

export function hourOptions(selectedHour?: number | null): SelectOption[] {
  return Array.from({ length: 24 }, (_, h) => ({
    label: String(h).padStart(2, "0"),
    value: String(h),
    ...(selectedHour !== null &&
    selectedHour !== undefined &&
    h === selectedHour
      ? { default: true }
      : {}),
  }));
}

export function minuteOptions(selectedMinute?: number): SelectOption[] {
  return [0, 15, 30, 45].map((m) => ({
    label: String(m).padStart(2, "0"),
    value: String(m),
    ...(selectedMinute !== undefined && m === selectedMinute
      ? { default: true }
      : {}),
  }));
}
