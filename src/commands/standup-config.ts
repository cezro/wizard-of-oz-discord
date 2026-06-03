import type { AppConfig } from "../config.js";
import {
  ephemeral,
  getSubcommand,
  getSubcommandIntegerOption,
  getSubcommandOption,
  getUserId,
  requireGuild,
  type DiscordInteraction,
  type InteractionResponse,
} from "../discord/interaction-utils.js";
import { requireManageGuild } from "../discord/permissions.js";
import { handleSetActiveDaysCommand } from "./standup-active-days.js";
import {
  configRowToTarget,
  getConfig,
  setEnabled,
  updateReporterRole,
  updateSchedule,
  upsertConfig,
} from "../storage/config-store.js";
import { formatUserFacingDiscordError } from "../utils/discord-api.js";
import {
  formatScheduleTime,
  resolveNudgeSchedule,
} from "../utils/timezone.js";
import {
  formatActiveWeekdays,
  normalizeActiveWeekdays,
} from "../utils/weekdays.js";

export type { DiscordInteraction };

function formatNudgeSchedule(row: {
  nudge_hour: number | null;
  nudge_minute: number;
  summary_hour: number;
  summary_minute: number;
  timezone: string;
}): string {
  if (row.nudge_hour === null) {
    const summaryTime = formatScheduleTime(row.summary_hour, row.summary_minute);
    return `same as summary (**${summaryTime}** \`${row.timezone}\`)`;
  }
  const time = formatScheduleTime(row.nudge_hour, row.nudge_minute);
  return `**${time}** (\`${row.timezone}\`)`;
}

function validateHourMinute(
  hour: number | undefined,
  minute: number | undefined,
): string | null {
  if (hour === undefined) return "Hour is required (0–23).";
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return "Hour must be an integer from 0 to 23.";
  }
  const m = minute ?? 0;
  if (!Number.isInteger(m) || m < 0 || m > 59) {
    return "Minute must be an integer from 0 to 59.";
  }
  return null;
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
            `**Active days:** ${formatActiveWeekdays(normalizeActiveWeekdays(row.active_weekdays))}`,
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

      case "set-reminder-time": {
        const hour = getSubcommandIntegerOption(interaction, "hour");
        const minute = getSubcommandIntegerOption(interaction, "minute");
        const validationError = validateHourMinute(hour, minute);
        if (validationError) return ephemeral(validationError);

        const row = await updateSchedule(config, guildId, {
          reminderHour: hour!,
          reminderMinute: minute ?? 0,
          updatedBy: userId,
        });

        const time = formatScheduleTime(
          row.reminder_hour!,
          row.reminder_minute,
        );
        return ephemeral(
          `DSM reminder scheduled for **${time}** (\`${row.timezone}\`) in <#${row.channel_id}>.`,
        );
      }

      case "set-summary-time": {
        const hour = getSubcommandIntegerOption(interaction, "hour");
        const minute = getSubcommandIntegerOption(interaction, "minute");
        const validationError = validateHourMinute(hour, minute);
        if (validationError) return ephemeral(validationError);

        const row = await updateSchedule(config, guildId, {
          summaryHour: hour!,
          summaryMinute: minute ?? 0,
          updatedBy: userId,
        });

        const time = formatScheduleTime(row.summary_hour, row.summary_minute);
        return ephemeral(
          `Daily summary scheduled for **${time}** (\`${row.timezone}\`) in <#${row.channel_id}>.`,
        );
      }

      case "show-schedule": {
        const row = await getConfig(config, guildId);
        if (!row) {
          return ephemeral(
            "No configuration yet. Run `/standup-config set` first.",
          );
        }

        const reminder =
          row.reminder_hour === null
            ? "disabled"
            : `${formatScheduleTime(row.reminder_hour, row.reminder_minute)} (\`${row.timezone}\`)`;
        const summary = `${formatScheduleTime(row.summary_hour, row.summary_minute)} (\`${row.timezone}\`)`;
        const nudge = formatNudgeSchedule(row);
        const reporterRole = row.reporter_role_id
          ? `<@&${row.reporter_role_id}>`
          : "not set";

        return ephemeral(
          [
            `**Channel:** <#${row.channel_id}>`,
            `**Timezone:** \`${row.timezone}\``,
            `**Reporter role:** ${reporterRole}`,
            `**Active days:** ${formatActiveWeekdays(normalizeActiveWeekdays(row.active_weekdays))}`,
            `**Reminder:** ${reminder}`,
            `**Missing DSM nudge:** ${nudge}`,
            `**Summary:** ${summary}`,
            `**Last reminder:** ${row.last_reminder_date ?? "never"}`,
            `**Last nudge:** ${row.last_nudge_date ?? "never"}`,
            `**Last summary:** ${row.last_summary_date ?? "never"}`,
          ].join("\n"),
        );
      }

      case "set-reporter-role": {
        const roleId = getSubcommandOption(interaction, "role");
        if (!roleId) return ephemeral("Role is required.");

        const row = await updateReporterRole(config, guildId, {
          reporterRoleId: roleId,
          updatedBy: userId,
        });

        return ephemeral(
          `Reporter role set to <@&${row.reporter_role_id}> in <#${row.channel_id}>.`,
        );
      }

      case "set-nudge-time": {
        const hour = getSubcommandIntegerOption(interaction, "hour");
        const minute = getSubcommandIntegerOption(interaction, "minute");
        const validationError = validateHourMinute(hour, minute);
        if (validationError) return ephemeral(validationError);

        const row = await updateSchedule(config, guildId, {
          nudgeHour: hour!,
          nudgeMinute: minute ?? 0,
          updatedBy: userId,
        });

        const time = formatScheduleTime(row.nudge_hour!, row.nudge_minute);
        return ephemeral(
          `Missing DSM nudge scheduled for **${time}** (\`${row.timezone}\`).`,
        );
      }

      case "clear-nudge-time": {
        const row = await updateSchedule(config, guildId, {
          nudgeHour: null,
          updatedBy: userId,
        });

        const target = configRowToTarget(row);
        const resolved = resolveNudgeSchedule(target);
        const time = formatScheduleTime(resolved.hour, resolved.minute);
        return ephemeral(
          `Missing DSM nudge will use the summary time (**${time}** \`${row.timezone}\`).`,
        );
      }

      case "set-active-days":
        return handleSetActiveDaysCommand(config, interaction);

      default:
        return ephemeral("Unknown subcommand.");
    }
  } catch (error) {
    return ephemeral(formatUserFacingDiscordError(error));
  }
}
