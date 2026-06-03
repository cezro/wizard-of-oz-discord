import type { AppConfig } from "../config.js";
import { broadcastReminder } from "../egress/discord.js";
import {
  ephemeral,
  requireGuild,
  type DiscordInteraction,
  type InteractionResponse,
} from "../discord/interaction-utils.js";
import { requireManageGuild } from "../discord/permissions.js";
import { getConfig } from "../storage/config-store.js";
import { formatUserFacingDiscordError } from "../utils/discord-api.js";

export async function handleStandupDebugCommand(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  if (!requireManageGuild(interaction)) {
    return ephemeral("You need **Manage Server** permission to use this command.");
  }

  const guildResult = requireGuild(interaction);
  if (!guildResult.ok) return guildResult.response;
  const { guildId } = guildResult;

  try {
    const row = await getConfig(config, guildId);
    if (!row) {
      return ephemeral(
        "No configuration yet. Run `/standup-config set` first.",
      );
    }

    await broadcastReminder(config, row.channel_id);

    return ephemeral(
      `Daily DSM reminder posted to <#${row.channel_id}>. (Cron \`last_reminder_date\` was not updated.)`,
    );
  } catch (error) {
    return ephemeral(formatUserFacingDiscordError(error));
  }
}
