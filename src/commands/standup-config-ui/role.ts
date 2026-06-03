import type { AppConfig } from "../../config.js";
import {
  ephemeral,
  type InteractionMessageData,
  type InteractionResponse,
} from "../../discord/interaction-utils.js";
import { updateReporterRole } from "../../storage/config-store.js";
import type { StandupConfigRow } from "../../storage/supabase.js";
import { NAV_HOME, ROLE_CLEAR, ROLE_PICK } from "./custom-ids.js";
import {
  ACTION_ROW,
  BTN_DANGER,
  BTN_SECONDARY,
  BUTTON,
  EMBED_COLOR,
  ROLE_SELECT,
} from "./components.js";
import { buildHomePayload } from "./home.js";

export function buildRolePanel(row: StandupConfigRow): InteractionMessageData {
  const reporterRole = row.reporter_role_id
    ? `<@&${row.reporter_role_id}>`
    : "not set";

  return {
    embeds: [
      {
        title: "Reporter role",
        description: [
          "Members with this role are expected to post a daily DSM and receive reminder pings.",
          "",
          `**Current:** ${reporterRole}`,
        ].join("\n"),
        color: EMBED_COLOR,
      },
    ],
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: ROLE_SELECT,
            custom_id: ROLE_PICK,
            placeholder: "Select reporter role",
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            style: BTN_DANGER,
            label: "Clear role",
            custom_id: ROLE_CLEAR,
            disabled: !row.reporter_role_id,
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

export async function handleRoleSelect(
  config: AppConfig,
  guildId: string,
  userId: string,
  values: string[],
  loadHome: (guildId: string) => Promise<StandupConfigRow | null>,
): Promise<InteractionResponse> {
  const roleId = values[0];
  if (!roleId) return ephemeral("No role selected.");

  await updateReporterRole(config, guildId, {
    reporterRoleId: roleId,
    updatedBy: userId,
  });

  const row = await loadHome(guildId);
  return { type: 7, data: buildHomePayload(row) };
}

export async function handleRoleClear(
  config: AppConfig,
  guildId: string,
  userId: string,
  loadHome: (guildId: string) => Promise<StandupConfigRow | null>,
): Promise<InteractionResponse> {
  await updateReporterRole(config, guildId, {
    reporterRoleId: null,
    updatedBy: userId,
  });

  const row = await loadHome(guildId);
  return { type: 7, data: buildHomePayload(row) };
}
