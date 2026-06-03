import type { AppConfig } from "../../config.js";
import {
  ephemeral,
  type InteractionMessageData,
  type InteractionResponse,
} from "../../discord/interaction-utils.js";
import {
  getConfig,
  patchConfig,
  upsertConfig,
} from "../../storage/config-store.js";
import type { StandupConfigRow } from "../../storage/supabase.js";
import { DEFAULT_TIMEZONE } from "../../utils/timezone-presets.js";
import {
  CHANNEL_PICK,
  CHANNEL_TIMEZONE_BTN,
  NAV_HOME,
} from "./custom-ids.js";
import {
  ACTION_ROW,
  BTN_SECONDARY,
  BUTTON,
  CHANNEL_SELECT,
  EMBED_COLOR,
} from "./components.js";
import { buildHomePayload } from "./home.js";

export {
  buildTimezoneModal,
  handleTimezoneButton,
  handleTimezoneModal,
} from "./timezone-modal.js";

export function buildChannelPanel(row: StandupConfigRow | null): InteractionMessageData {
  const description = row
    ? [
        "Pick the DSM channel and set the guild timezone.",
        "",
        `**Channel:** <#${row.channel_id}>`,
        `**Timezone:** \`${row.timezone}\``,
        "",
        "_You can also change timezone under **Time region** on the hub._",
      ].join("\n")
    : [
        "Pick the DSM channel to get started.",
        `Default timezone: \`${DEFAULT_TIMEZONE}\` (change with **Set timezone** or **Time region**).`,
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
