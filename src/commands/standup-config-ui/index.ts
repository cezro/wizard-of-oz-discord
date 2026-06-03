import type { AppConfig } from "../../config.js";
import {
  ephemeral,
  ephemeralMessageWithComponents,
  getInteractionCustomId,
  getSelectValues,
  getUserId,
  requireGuild,
  updateMessage,
  type DiscordInteraction,
  type InteractionResponse,
} from "../../discord/interaction-utils.js";
import { requireManageGuild } from "../../discord/permissions.js";
import {
  getConfig,
  setEnabled,
} from "../../storage/config-store.js";
import { formatUserFacingDiscordError } from "../../utils/discord-api.js";
import {
  buildActiveDaysPanel,
  handleActiveDaysInteraction,
  maskFromRow,
} from "./active-days.js";
import {
  buildChannelPanel,
  handleChannelSelect,
  handleTimezoneButton,
  handleTimezoneModal,
} from "./channel.js";
import {
  buildTimezonePanel,
  handleTimezoneSelect,
} from "./timezone.js";
import {
  ACTIVE_DAYS_PREFIX,
  CHANNEL_PICK,
  CHANNEL_TIMEZONE_BTN,
  CONFIG_PREFIX,
  NAV_ACTIVE_DAYS,
  NAV_CHANNEL,
  NAV_HOME,
  NAV_ROLE,
  NAV_SCHEDULE,
  NAV_TIMEZONE,
  ROLE_CLEAR,
  ROLE_PICK,
  SCHEDULE_PREFIX,
  TIMEZONE_MODAL_ID,
  TIMEZONE_PICK,
  TOGGLE_ENABLED,
} from "./custom-ids.js";
import { buildHomePayload } from "./home.js";
import {
  buildRolePanel,
  handleRoleClear,
  handleRoleSelect,
} from "./role.js";
import {
  buildSchedulePanel,
  draftFromRow,
  handleScheduleInteraction,
} from "./schedule.js";

const INTERACTION_MODAL_SUBMIT = 5;

async function loadHomeRow(config: AppConfig, guildId: string) {
  return getConfig(config, guildId);
}

function requireConfigured(
  row: Awaited<ReturnType<typeof getConfig>>,
): InteractionResponse | null {
  if (!row) {
    return ephemeral("Set up a channel first via **Channel**.");
  }
  return null;
}

export function isConfigUiInteraction(interaction: DiscordInteraction): boolean {
  const customId = getInteractionCustomId(interaction);
  if (customId?.startsWith(CONFIG_PREFIX)) return true;
  return interaction.type === INTERACTION_MODAL_SUBMIT &&
    interaction.data?.custom_id === TIMEZONE_MODAL_ID;
}

export async function handleStandupConfigCommand(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  if (!requireManageGuild(interaction)) {
    return ephemeral("You need **Manage Server** permission to use this command.");
  }

  const guildResult = requireGuild(interaction);
  if (!guildResult.ok) return guildResult.response;

  try {
    const row = await loadHomeRow(config, guildResult.guildId);
    if (!row) {
      return ephemeralMessageWithComponents(buildChannelPanel(null));
    }
    return ephemeralMessageWithComponents(buildHomePayload(row));
  } catch (error) {
    return ephemeral(formatUserFacingDiscordError(error));
  }
}

export async function handleConfigUiInteraction(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  if (!requireManageGuild(interaction)) {
    return ephemeral("You need **Manage Server** permission to use this.");
  }

  const guildResult = requireGuild(interaction);
  if (!guildResult.ok) return guildResult.response;
  const { guildId } = guildResult;
  const userId = getUserId(interaction);

  try {
    if (interaction.type === INTERACTION_MODAL_SUBMIT) {
      if (interaction.data?.custom_id === TIMEZONE_MODAL_ID) {
        return handleTimezoneModal(
          config,
          guildId,
          userId,
          interaction,
          (id) => loadHomeRow(config, id),
        );
      }
      return ephemeral("Unknown modal.");
    }

    const customId = getInteractionCustomId(interaction);
    if (!customId?.startsWith(CONFIG_PREFIX)) {
      return ephemeral("Unknown control.");
    }

    if (customId === NAV_HOME) {
      const row = await loadHomeRow(config, guildId);
      return updateMessage(buildHomePayload(row));
    }

    if (customId === NAV_CHANNEL) {
      const row = await loadHomeRow(config, guildId);
      return updateMessage(buildChannelPanel(row));
    }

    if (customId === CHANNEL_TIMEZONE_BTN) {
      return handleTimezoneButton();
    }

    if (customId === CHANNEL_PICK) {
      return handleChannelSelect(
        config,
        guildId,
        userId,
        getSelectValues(interaction),
        (id) => loadHomeRow(config, id),
      );
    }

    if (customId === NAV_TIMEZONE) {
      const row = await loadHomeRow(config, guildId);
      const err = requireConfigured(row);
      if (err) return err;
      return updateMessage(buildTimezonePanel(row!));
    }

    if (customId === TIMEZONE_PICK) {
      const row = await loadHomeRow(config, guildId);
      const err = requireConfigured(row);
      if (err) return err;
      return handleTimezoneSelect(
        config,
        guildId,
        userId,
        getSelectValues(interaction),
        (id) => loadHomeRow(config, id),
      );
    }

    if (customId === NAV_ROLE) {
      const row = await loadHomeRow(config, guildId);
      const err = requireConfigured(row);
      if (err) return err;
      return updateMessage(buildRolePanel(row!));
    }

    if (customId === ROLE_PICK) {
      const row = await loadHomeRow(config, guildId);
      const err = requireConfigured(row);
      if (err) return err;
      return handleRoleSelect(
        config,
        guildId,
        userId,
        getSelectValues(interaction),
        (id) => loadHomeRow(config, id),
      );
    }

    if (customId === ROLE_CLEAR) {
      const row = await loadHomeRow(config, guildId);
      const err = requireConfigured(row);
      if (err) return err;
      return handleRoleClear(config, guildId, userId, (id) =>
        loadHomeRow(config, id),
      );
    }

    if (customId === NAV_SCHEDULE) {
      const row = await loadHomeRow(config, guildId);
      const err = requireConfigured(row);
      if (err) return err;
      return updateMessage(
        buildSchedulePanel(draftFromRow(row!), row!.timezone),
      );
    }

    if (customId.startsWith(SCHEDULE_PREFIX)) {
      const row = await loadHomeRow(config, guildId);
      const err = requireConfigured(row);
      if (err) return err;
      return handleScheduleInteraction(
        config,
        guildId,
        interaction,
        row!,
        (id) => loadHomeRow(config, id),
      );
    }

    if (customId === NAV_ACTIVE_DAYS) {
      const row = await loadHomeRow(config, guildId);
      const err = requireConfigured(row);
      if (err) return err;
      return updateMessage(buildActiveDaysPanel(maskFromRow(row!)));
    }

    if (customId.startsWith(ACTIVE_DAYS_PREFIX)) {
      return handleActiveDaysInteraction(config, guildId, interaction, (id) =>
        loadHomeRow(config, id),
      );
    }

    if (customId === TOGGLE_ENABLED) {
      const row = await loadHomeRow(config, guildId);
      const err = requireConfigured(row);
      if (err) return err;
      await setEnabled(config, guildId, !row!.enabled, userId);
      const updated = await loadHomeRow(config, guildId);
      return updateMessage(buildHomePayload(updated));
    }

    return ephemeral("Unknown control.");
  } catch (error) {
    return ephemeral(formatUserFacingDiscordError(error));
  }
}
