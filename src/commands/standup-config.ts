import type { AppConfig } from "../config.js";
import {
  ephemeral,
  getSubcommand,
  getSubcommandOption,
  getUserId,
  requireGuild,
  type DiscordInteraction,
  type InteractionResponse,
} from "../discord/interaction-utils.js";
import { requireManageGuild } from "../discord/permissions.js";
import {
  getConfig,
  setEnabled,
  upsertConfig,
} from "../storage/config-store.js";

export type { DiscordInteraction };

export async function handleStandupConfigCommand(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  if (!requireManageGuild(interaction)) {
    return ephemeral("You need **Manage Server** permission to use this command.");
  }

  const guildResult = requireGuild(interaction);
  if (!guildResult.ok) return guildResult.response;
  const { guildId } = guildResult;

  const userId = getUserId(interaction);
  const subcommand = getSubcommand(interaction);

  try {
    switch (subcommand) {
      case "set": {
        const channelId = getSubcommandOption(interaction, "channel");
        if (!channelId) {
          return ephemeral("A channel is required.");
        }
        const timezone =
          getSubcommandOption(interaction, "timezone") ?? "Asia/Manila";

        try {
          Intl.DateTimeFormat(undefined, { timeZone: timezone });
        } catch {
          return ephemeral(
            `Invalid timezone \`${timezone}\`. Use an IANA name like \`Asia/Manila\`.`,
          );
        }

        const row = await upsertConfig(config, {
          guildId,
          channelId,
          timezone,
          updatedBy: userId,
        });

        return ephemeral(
          `Standup channel set to <#${row.channel_id}> (timezone: \`${row.timezone}\`). Daily summaries are **enabled**.`,
        );
      }

      case "show": {
        const row = await getConfig(config, guildId);
        if (!row) {
          return ephemeral(
            "No configuration yet. Run `/standup-config set` to choose a standup channel.",
          );
        }
        return ephemeral(
          [
            `**Channel:** <#${row.channel_id}>`,
            `**Timezone:** \`${row.timezone}\``,
            `**Enabled:** ${row.enabled ? "yes" : "no"}`,
            `**Updated:** ${new Date(row.updated_at).toLocaleString("en-US", { timeZone: row.timezone })}`,
          ].join("\n"),
        );
      }

      case "enable": {
        const row = await setEnabled(config, guildId, true, userId);
        return ephemeral(
          `Daily standup summaries **enabled** for <#${row.channel_id}>.`,
        );
      }

      case "disable": {
        const row = await setEnabled(config, guildId, false, userId);
        return ephemeral(
          `Daily standup summaries **disabled** for <#${row.channel_id}>.`,
        );
      }

      default:
        return ephemeral("Unknown subcommand.");
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    return ephemeral(message);
  }
}
