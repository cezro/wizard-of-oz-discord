import type { AppConfig } from "../../config.js";
import {
  ephemeral,
  getInteractionCustomId,
  getUserId,
  type DiscordInteraction,
  type InteractionMessageData,
  type InteractionResponse,
} from "../../discord/interaction-utils.js";
import { updateActiveWeekdays } from "../../storage/config-store.js";
import {
  bitmaskToWeekdays,
  formatActiveWeekdays,
  normalizeActiveWeekdays,
  toggleBitmaskDay,
  WEEKDAY_MASK_ALL,
  WEEKDAY_MASK_WEEKDAYS,
  WEEKDAY_SHORT,
  weekdaysToBitmask,
} from "../../utils/weekdays.js";
import type { StandupConfigRow } from "../../storage/supabase.js";
import {
  ACTIVE_DAYS_PREFIX,
  NAV_HOME,
} from "./custom-ids.js";
import {
  ACTION_ROW,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_SUCCESS,
  BUTTON,
  EMBED_COLOR,
} from "./components.js";
import { buildHomePayload } from "./home.js";

function toggleCustomId(day: number, mask: number): string {
  return `${ACTIVE_DAYS_PREFIX}toggle:${day}:${mask}`;
}

function saveCustomId(mask: number): string {
  return `${ACTIVE_DAYS_PREFIX}save:${mask}`;
}

export function buildActiveDaysPanel(mask: number): InteractionMessageData {
  const weekdays = bitmaskToWeekdays(mask);
  const selected =
    weekdays.length > 0
      ? formatActiveWeekdays(weekdays)
      : "_none (select at least one before saving)_";

  const dayButtons = [];
  for (let day = 0; day <= 6; day++) {
    const active = (mask & (1 << day)) !== 0;
    dayButtons.push({
      type: BUTTON,
      style: active ? BTN_SUCCESS : BTN_SECONDARY,
      label: active ? `${WEEKDAY_SHORT[day]} ✓` : WEEKDAY_SHORT[day],
      custom_id: toggleCustomId(day, mask),
    });
  }

  return {
    embeds: [
      {
        title: "Active weekdays",
        description: [
          "Toggle which days run the automated **reminder**, **missing-DSM nudge**, and **summary**.",
          "",
          `**Selected:** ${selected}`,
        ].join("\n"),
        color: EMBED_COLOR,
      },
    ],
    components: [
      { type: ACTION_ROW, components: dayButtons.slice(0, 5) },
      {
        type: ACTION_ROW,
        components: [
          ...dayButtons.slice(5),
          {
            type: BUTTON,
            style: BTN_PRIMARY,
            label: "Save",
            custom_id: saveCustomId(mask),
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Weekdays",
            custom_id: `${ACTIVE_DAYS_PREFIX}preset:weekdays`,
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "All",
            custom_id: `${ACTIVE_DAYS_PREFIX}preset:all`,
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
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

export function maskFromRow(row: StandupConfigRow): number {
  return weekdaysToBitmask(normalizeActiveWeekdays(row.active_weekdays));
}

export async function handleActiveDaysInteraction(
  config: AppConfig,
  guildId: string,
  interaction: DiscordInteraction,
  loadHome: (guildId: string) => Promise<StandupConfigRow | null>,
): Promise<InteractionResponse> {
  const customId = getInteractionCustomId(interaction);
  if (!customId?.startsWith(ACTIVE_DAYS_PREFIX)) {
    return ephemeral("Unknown active-days control.");
  }

  const rest = customId.slice(ACTIVE_DAYS_PREFIX.length);

  if (rest === "preset:weekdays") {
    return { type: 7, data: buildActiveDaysPanel(WEEKDAY_MASK_WEEKDAYS) };
  }
  if (rest === "preset:all") {
    return { type: 7, data: buildActiveDaysPanel(WEEKDAY_MASK_ALL) };
  }

  const [action, arg1, arg2] = rest.split(":");
  if (action === "toggle") {
    const day = Number(arg1);
    const mask = Number(arg2);
    if (!Number.isInteger(day) || day < 0 || day > 6 || !Number.isInteger(mask)) {
      return ephemeral("Invalid state. Open /standup-config again.");
    }
    return { type: 7, data: buildActiveDaysPanel(toggleBitmaskDay(mask, day)) };
  }

  if (action === "save") {
    const mask = Number(arg1);
    if (!Number.isInteger(mask)) {
      return ephemeral("Invalid state. Open /standup-config again.");
    }

    const weekdays = bitmaskToWeekdays(mask);
    if (weekdays.length === 0) {
      return ephemeral("Select at least one day before saving.");
    }

    await updateActiveWeekdays(config, guildId, {
      activeWeekdays: weekdays,
      updatedBy: getUserId(interaction),
    });

    const row = await loadHome(guildId);
    return { type: 7, data: buildHomePayload(row) };
  }

  return ephemeral("Unknown active-days action.");
}
