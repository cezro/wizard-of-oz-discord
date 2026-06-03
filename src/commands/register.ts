import type { AppConfig } from "../config.js";
import { discordJson } from "../utils/discord-api.js";

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

  if (config.discordGuildId) {
    await discordJson(
      config.discordBotToken,
      `/applications/${config.discordApplicationId}/guilds/${config.discordGuildId}/commands`,
      {
        method: "PUT",
        body: JSON.stringify(commands),
      },
    );
    console.log(
      `Registered slash commands for guild ${config.discordGuildId}`,
    );
  } else {
    await discordJson(
      config.discordBotToken,
      `/applications/${config.discordApplicationId}/commands`,
      {
        method: "PUT",
        body: JSON.stringify(commands),
      },
    );
    console.log("Registered global slash commands");
  }
}
