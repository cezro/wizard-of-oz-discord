import type { AppConfig } from "../../config.js";
import {
  ephemeral,
  type InteractionMessageData,
  type InteractionResponse,
} from "../../discord/interaction-utils.js";
import { patchConfig } from "../../storage/config-store.js";
import type { StandupConfigRow } from "../../storage/supabase.js";
import {
  isKnownTimezonePreset,
  TIMEZONE_PRESET_OPTIONS,
  validateTimezone,
  invalidTimezoneMessage,
} from "../../utils/timezone-presets.js";
import {
  CHANNEL_TIMEZONE_BTN,
  NAV_HOME,
  TIMEZONE_PICK,
} from "./custom-ids.js";
import {
  ACTION_ROW,
  BTN_SECONDARY,
  BUTTON,
  EMBED_COLOR,
  STRING_SELECT,
} from "./components.js";
import { buildHomePayload } from "./home.js";

export function buildTimezonePanel(row: StandupConfigRow): InteractionMessageData {
  const select: Record<string, unknown> = {
    type: STRING_SELECT,
    custom_id: TIMEZONE_PICK,
    placeholder: "Select time region",
    options: TIMEZONE_PRESET_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  };

  if (isKnownTimezonePreset(row.timezone)) {
    select.default_values = [row.timezone];
  }

  return {
    embeds: [
      {
        title: "Time region",
        description: [
          "IANA timezone used for schedule matching, active weekdays, and summary dates.",
          "",
          `**Current:** \`${row.timezone}\``,
          "",
          "Choose a preset below, or use **Custom IANA** for any valid region name.",
        ].join("\n"),
        color: EMBED_COLOR,
      },
    ],
    components: [
      { type: ACTION_ROW, components: [select] },
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Custom IANA",
            custom_id: CHANNEL_TIMEZONE_BTN,
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Back",
            custom_id: NAV_HOME,
          },
        ],
      },
    ],
  };
}

export async function handleTimezoneSelect(
  config: AppConfig,
  guildId: string,
  userId: string,
  values: string[],
  loadHome: (guildId: string) => Promise<StandupConfigRow | null>,
): Promise<InteractionResponse> {
  const timezone = values[0];
  if (!timezone) return ephemeral("No time region selected.");

  if (!validateTimezone(timezone)) {
    return ephemeral(invalidTimezoneMessage(timezone));
  }

  await patchConfig(config, guildId, { timezone, updatedBy: userId });
  const row = await loadHome(guildId);
  return { type: 7, data: buildHomePayload(row) };
}
