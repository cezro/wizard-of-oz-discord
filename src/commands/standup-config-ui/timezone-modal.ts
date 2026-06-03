import type { AppConfig } from "../../config.js";
import {
  ephemeral,
  getModalTextValue,
  openModal,
  type DiscordInteraction,
  type InteractionResponse,
} from "../../discord/interaction-utils.js";
import { getConfig, patchConfig } from "../../storage/config-store.js";
import type { StandupConfigRow } from "../../storage/supabase.js";
import {
  invalidTimezoneMessage,
  validateTimezone,
} from "../../utils/timezone-presets.js";
import { TIMEZONE_INPUT_ID, TIMEZONE_MODAL_ID } from "./custom-ids.js";
import { buildHomePayload } from "./home.js";

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

export function handleTimezoneButton(): InteractionResponse {
  return openModal(buildTimezoneModal());
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

  if (!validateTimezone(timezone)) {
    return ephemeral(invalidTimezoneMessage(timezone));
  }

  const existing = await getConfig(config, guildId);
  if (!existing) {
    return ephemeral("Pick a channel first, then set the timezone.");
  }

  await patchConfig(config, guildId, { timezone, updatedBy: userId });
  const row = await loadHome(guildId);
  return { type: 7, data: buildHomePayload(row) };
}
