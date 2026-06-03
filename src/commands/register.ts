import type { AppConfig } from "../config.js";
import { DiscordApiError, discordJson } from "../utils/discord-api.js";

const MANAGE_GUILD_PERMISSION = "32";

const SUMMARIZE_MONTH_OPTION = {
  type: 4,
  name: "month",
  description: "Month (1–12). Defaults to current month (guild timezone).",
  required: false,
  min_value: 1,
  max_value: 12,
};

const SUMMARIZE_DAY_OPTION = {
  type: 4,
  name: "day",
  description: "Day (1–31). Defaults to current day (guild timezone).",
  required: false,
  min_value: 1,
  max_value: 31,
};

const SUMMARIZE_YEAR_OPTION = {
  type: 4,
  name: "year",
  description: "Year. Defaults to current year (guild timezone).",
  required: false,
  min_value: 2000,
  max_value: 2100,
};

const STANDUP_CONFIG_COMMAND = {
  name: "standup-config",
  description: "Open the interactive standup configuration hub",
  default_member_permissions: MANAGE_GUILD_PERMISSION,
};

const STANDUP_DEBUG_COMMAND = {
  name: "standup-debug",
  description: "Debug: force-post the daily DSM reminder (not missing-reporter nudge)",
  default_member_permissions: MANAGE_GUILD_PERMISSION,
};

const STANDUP_COMMAND = {
  name: "standup",
  description: "Manual standup actions for this server",
  options: [
    {
      type: 1,
      name: "summarize",
      description: "Force-run the summary pipeline now for this server",
      options: [
        SUMMARIZE_MONTH_OPTION,
        SUMMARIZE_DAY_OPTION,
        SUMMARIZE_YEAR_OPTION,
      ],
    },
    {
      type: 1,
      name: "remind-missing",
      description:
        "Remind members with the reporter role who have not posted today",
    },
  ],
};

export async function registerSlashCommands(config: AppConfig): Promise<void> {
  const commands = [STANDUP_CONFIG_COMMAND, STANDUP_COMMAND, STANDUP_DEBUG_COMMAND];

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
