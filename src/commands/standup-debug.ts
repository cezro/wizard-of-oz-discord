import type { AppConfig } from "../config.js";
import {
  ephemeral,
  getSubcommand,
  getSubcommandIntegerOption,
  getUserId,
  requireGuild,
  type DiscordInteraction,
  type InteractionResponse,
} from "../discord/interaction-utils.js";
import { requireManageGuild } from "../discord/permissions.js";
import { runPipeline } from "../pipeline.js";
import {
  configRowToTarget,
  getConfig,
  updateSchedule,
} from "../storage/config-store.js";
import { formatScheduleTime } from "../utils/timezone.js";

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

  const userId = getUserId(interaction);
  const subcommand = getSubcommand(interaction);

  try {
    switch (subcommand) {
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

        return ephemeral(
          [
            `**Channel:** <#${row.channel_id}>`,
            `**Timezone:** \`${row.timezone}\``,
            `**Reminder:** ${reminder}`,
            `**Summary:** ${summary}`,
            `**Last reminder:** ${row.last_reminder_date ?? "never"}`,
            `**Last summary:** ${row.last_summary_date ?? "never"}`,
          ].join("\n"),
        );
      }

      case "summarize": {
        const row = await getConfig(config, guildId);
        if (!row) {
          return ephemeral(
            "No configuration yet. Run `/standup-config set` first.",
          );
        }

        const target = configRowToTarget(row);
        const result = await runPipeline(config, target);

        return ephemeral(
          [
            "Summary pipeline completed.",
            `**Messages ingested:** ${result.messageCount}`,
            `**Posted:** ${result.posted}`,
            `**Channel:** <#${result.channelId}>`,
          ].join("\n"),
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
