import type { AppConfig } from "../config.js";
import { DiscordApiError, discordJson } from "../utils/discord-api.js";

const MANAGE_GUILD_PERMISSION = "32";

const STANDUP_CONFIG_COMMAND = {
  name: "standup-config",
  description: "Configure the daily standup summarizer bot",
  default_member_permissions: MANAGE_GUILD_PERMISSION,
  options: [
    {
      type: 1,
      name: "set",
      description: "Set the standup channel for this server",
      options: [
        {
          type: 7,
          name: "channel",
          description: "Channel where daily standups are posted",
          required: true,
        },
        {
          type: 3,
          name: "timezone",
          description: "IANA timezone for summaries (default: Asia/Manila)",
          required: false,
        },
      ],
    },
    {
      type: 1,
      name: "show",
      description: "Show current standup configuration",
    },
    {
      type: 1,
      name: "enable",
      description: "Enable daily standup summaries for this server",
    },
    {
      type: 1,
      name: "disable",
      description: "Disable daily standup summaries for this server",
    },
  ],
};

export async function registerSlashCommands(config: AppConfig): Promise<void> {
  const commands = [STANDUP_CONFIG_COMMAND];

  try {
    await discordJson(
      config.discordBotToken,
      `/applications/${config.discordApplicationId}/commands`,
      {
        method: "PUT",
        body: JSON.stringify(commands),
      },
    );
    console.log(
      "Registered global slash commands (available in all servers; may take up to ~1 hour on first deploy)",
    );
  } catch (error) {
    if (error instanceof DiscordApiError && error.status === 403) {
      console.error(
        "[commands/register] Forbidden — check the bot token and application ID.",
      );
    }
    throw error;
  }
}
