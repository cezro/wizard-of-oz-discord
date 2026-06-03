import type { AppConfig } from "../config.js";
import { DiscordApiError, discordJson } from "../utils/discord-api.js";

const MANAGE_GUILD_PERMISSION = "32";

const HOUR_OPTION = {
  type: 4,
  name: "hour",
  description: "Hour in guild timezone (0–23)",
  required: true,
  min_value: 0,
  max_value: 23,
};

const MINUTE_OPTION = {
  type: 4,
  name: "minute",
  description: "Minute (0–59, default 0)",
  required: false,
  min_value: 0,
  max_value: 59,
};

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
  description: "Configure the daily standup summarizer for this server",
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
    {
      type: 1,
      name: "set-reminder-time",
      description: "Set when the bot reminds everyone to post their DSM",
      options: [HOUR_OPTION, MINUTE_OPTION],
    },
    {
      type: 1,
      name: "set-summary-time",
      description: "Set when the daily summary runs",
      options: [HOUR_OPTION, MINUTE_OPTION],
    },
    {
      type: 1,
      name: "show-schedule",
      description: "Show reminder and summary schedule for this server",
    },
    {
      type: 1,
      name: "set-reporter-role",
      description: "Set the role whose members must post a daily DSM",
      options: [
        {
          type: 8,
          name: "role",
          description: "Members with this role are expected to report",
          required: true,
        },
      ],
    },
    {
      type: 1,
      name: "set-nudge-time",
      description:
        "Set when to remind members who have not posted (defaults to summary time)",
      options: [HOUR_OPTION, MINUTE_OPTION],
    },
    {
      type: 1,
      name: "clear-nudge-time",
      description: "Use the summary time for missing-DSM reminders",
    },
    {
      type: 1,
      name: "set-active-days",
      description:
        "Choose which days run reminders and summaries (interactive toggles)",
    },
  ],
};

const STANDUP_DEBUG_COMMAND = {
  name: "standup-debug",
  description: "Debug: force-post the daily DSM reminder (not missing-reporter nudge)",
  default_member_permissions: MANAGE_GUILD_PERMISSION,
};

const STANDUP_COMMAND = {
  name: "standup",
  description: "Manual standup actions for this server",
  default_member_permissions: MANAGE_GUILD_PERMISSION,
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
