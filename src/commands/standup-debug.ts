import type { AppConfig } from "../config.js";
import {
  ephemeral,
  requireGuild,
  type DiscordInteraction,
  type InteractionResponse,
} from "../discord/interaction-utils.js";
import { requireManageGuild } from "../discord/permissions.js";
import { configRowToTarget, getConfig } from "../storage/config-store.js";
import { runDailyReminder } from "../standup/reminder.js";
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
        "No configuration yet. Run `/standup-config` first.",
      );
    }

    const target = configRowToTarget(row);
    const { pingedCount } = await runDailyReminder(config, target);

    const pingNote =
      pingedCount > 0
        ? ` Pinged **${pingedCount}** reporter(s).`
        : " No reporter role configured — text only.";

    return ephemeral(
      `Daily DSM reminder posted to <#${row.channel_id}>.${pingNote} (Cron \`last_reminder_date\` was not updated.)`,
    );
  } catch (error) {
    return ephemeral(formatUserFacingDiscordError(error));
  }
}
