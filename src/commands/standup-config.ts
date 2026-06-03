import type { AppConfig } from "../config.js";
import {
  getConfig,
  setEnabled,
  upsertConfig,
} from "../storage/config-store.js";

const EPHEMERAL = 64;
const RESPONSE_MESSAGE = 4;

interface InteractionOption {
  type: number;
  name: string;
  value?: string | number;
  options?: InteractionOption[];
}

export interface DiscordInteraction {
  type: number;
  data?: {
    name: string;
    options?: InteractionOption[];
  };
  guild_id?: string;
  member?: { user: { id: string } };
  user?: { id: string };
}

type InteractionResponse = Record<string, unknown>;

function ephemeral(content: string): InteractionResponse {
  return {
    type: RESPONSE_MESSAGE,
    data: { content, flags: EPHEMERAL },
  };
}

function getUserId(interaction: DiscordInteraction): string {
  return interaction.member?.user.id ?? interaction.user?.id ?? "unknown";
}

function getSubcommand(interaction: DiscordInteraction): string | undefined {
  return interaction.data?.options?.[0]?.name;
}

function getSubcommandOption(
  interaction: DiscordInteraction,
  optionName: string,
): string | undefined {
  const sub = interaction.data?.options?.[0];
  const opt = sub?.options?.find((o) => o.name === optionName);
  if (opt?.value === undefined) return undefined;
  return String(opt.value);
}

export async function handleStandupConfigCommand(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return ephemeral("This command can only be used in a server.");
  }

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
