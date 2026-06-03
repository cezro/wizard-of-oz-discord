import type { AppConfig } from "../../config.js";
import {
  ephemeral,
  getModalTextValue,
  openModal,
  type DiscordInteraction,
  type InteractionMessageData,
  type InteractionResponse,
} from "../../discord/interaction-utils.js";
import {
  getConfig,
  patchConfig,
  upsertConfig,
} from "../../storage/config-store.js";
import type { StandupConfigRow } from "../../storage/supabase.js";
import {
  CHANNEL_PICK,
  CHANNEL_TIMEZONE_BTN,
  NAV_HOME,
  TIMEZONE_INPUT_ID,
  TIMEZONE_MODAL_ID,
} from "./custom-ids.js";
import {
  ACTION_ROW,
  BTN_SECONDARY,
  BUTTON,
  CHANNEL_SELECT,
  EMBED_COLOR,
} from "./components.js";
import { buildHomePayload } from "./home.js";

const DEFAULT_TIMEZONE = "Asia/Manila";

export function buildChannelPanel(row: StandupConfigRow | null): InteractionMessageData {
  const description = row
    ? [
        "Pick the DSM channel and set the guild timezone.",
        "",
        `**Channel:** <#${row.channel_id}>`,
        `**Timezone:** \`${row.timezone}\``,
      ].join("\n")
    : [
        "Pick the DSM channel to get started.",
        `Default timezone: \`${DEFAULT_TIMEZONE}\` (change with **Set timezone**).`,
      ].join("\n");

  return {
    embeds: [
      {
        title: "Channel and timezone",
        description,
        color: EMBED_COLOR,
      },
    ],
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: CHANNEL_SELECT,
            custom_id: CHANNEL_PICK,
            placeholder: "Select standup channel",
            channel_types: [0],
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Set timezone",
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

export function buildTimezoneModal(): Record<string, unknown> {
  return {
    custom_id: TIMEZONE_MODAL_ID,
    title: "Guild timezone",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: TIMEZONE_INPUT_ID,
            label: "IANA timezone",
            style: 1,
            placeholder: "Asia/Manila",
            required: true,
            max_length: 64,
          },
        ],
      },
    ],
  };
}

export async function handleChannelSelect(
  config: AppConfig,
  guildId: string,
  userId: string,
  values: string[],
  loadHome: (guildId: string) => Promise<StandupConfigRow | null>,
): Promise<InteractionResponse> {
  const channelId = values[0];
  if (!channelId) return ephemeral("No channel selected.");

  const existing = await getConfig(config, guildId);
  if (!existing) {
    await upsertConfig(config, {
      guildId,
      channelId,
      timezone: DEFAULT_TIMEZONE,
      updatedBy: userId,
    });
  } else {
    await patchConfig(config, guildId, {
      channelId,
      updatedBy: userId,
    });
  }

  const row = await loadHome(guildId);
  return { type: 7, data: buildHomePayload(row) };
}

export async function handleTimezoneModal(
  config: AppConfig,
  guildId: string,
  userId: string,
  interaction: DiscordInteraction,
  loadHome: (guildId: string) => Promise<StandupConfigRow | null>,
): Promise<InteractionResponse> {
  const timezone = getModalTextValue(interaction, TIMEZONE_INPUT_ID)?.trim();
  if (!timezone) return ephemeral("Timezone is required.");

  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    return ephemeral(
      `Invalid timezone \`${timezone}\`. Use an IANA name like \`Asia/Manila\`.`,
    );
  }

  const existing = await getConfig(config, guildId);
  if (!existing) {
    return ephemeral("Pick a channel first, then set the timezone.");
  }

  await patchConfig(config, guildId, { timezone, updatedBy: userId });
  const row = await loadHome(guildId);
  return { type: 7, data: buildHomePayload(row) };
}

export function handleTimezoneButton(): InteractionResponse {
  return openModal(buildTimezoneModal());
}
