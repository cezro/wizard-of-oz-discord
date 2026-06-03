import type { AppConfig } from "../config.js";
import { editDeferredInteraction } from "../discord/interaction-followup.js";
import {
  deferredEphemeral,
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
import { runPipeline, type RunPipelineOptions } from "../pipeline.js";
import { runMissingReporterNudge } from "../standup/missing-reporters.js";
import type { InvalidCheckIn } from "../types.js";
import {
  configRowToTarget,
  getConfig,
  updateReporterRole,
  updateSchedule,
} from "../storage/config-store.js";
import type { StandupTarget } from "../types.js";
import { formatUserFacingDiscordError } from "../utils/discord-api.js";
import {
  formatScheduleTime,
  getCalendarDayWindow,
  resolveNudgeSchedule,
  resolveSummarizeDate,
} from "../utils/timezone.js";

async function runSummarizeAndFollowUp(
  config: AppConfig,
  applicationId: string,
  interactionToken: string,
  target: StandupTarget,
  timezone: string,
  pipelineOptions: RunPipelineOptions,
  usedFallback: boolean,
): Promise<void> {
  try {
    const result = await runPipeline(config, target, pipelineOptions);
    const lines = [
      "Summary pipeline completed.",
      `**Date:** ${pipelineOptions.summaryDate} (\`${timezone}\`)`,
      `**Messages ingested:** ${result.messageCount}`,
      `**Posted:** ${result.posted}`,
      `**Channel:** <#${result.channelId}>`,
    ];
    if (usedFallback) {
      lines.push("_Invalid `date` option; summarized today instead._");
    }
    await editDeferredInteraction(
      applicationId,
      interactionToken,
      lines.join("\n"),
    );
  } catch (error) {
    await editDeferredInteraction(
      applicationId,
      interactionToken,
      formatUserFacingDiscordError(error),
    );
  }
}

async function runRemindMissingAndFollowUp(
  config: AppConfig,
  applicationId: string,
  interactionToken: string,
  target: StandupTarget,
): Promise<void> {
  try {
    const result = await runMissingReporterNudge(config, target);
    await editDeferredInteraction(
      applicationId,
      interactionToken,
      formatRemindMissingReply(result, target.channelId),
    );
  } catch (error) {
    await editDeferredInteraction(
      applicationId,
      interactionToken,
      formatUserFacingDiscordError(error),
    );
  }
}

function formatRemindMissingReply(
  result: {
    posted: boolean;
    missingCount: number;
    expectedCount: number;
    invalidCheckIns: InvalidCheckIn[];
  },
  channelId: string,
): string {
  const lines: string[] = [];

  if (!result.posted) {
    lines.push(
      "Everyone with the reporter role has posted a valid DSM in the rolling 24-hour window.",
    );
  } else {
    lines.push("Missing DSM reminder posted.");
    lines.push(`**Mentioned:** ${result.missingCount} member(s)`);
    lines.push(`**Expected reporters:** ${result.expectedCount}`);
    lines.push(`**Channel:** <#${channelId}>`);
  }

  if (result.invalidCheckIns.length > 0) {
    lines.push("");
    lines.push("**Invalid check-ins** (do not count toward completion):");
    for (const entry of result.invalidCheckIns) {
      lines.push(`- <@${entry.authorId}>: \`${entry.preview}\``);
    }
  }

  return lines.join("\n");
}

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

export async function handleStandupCommand(
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
        const nudge = formatNudgeSchedule(row);
        const reporterRole = row.reporter_role_id
          ? `<@&${row.reporter_role_id}>`
          : "not set";

        return ephemeral(
          [
            `**Channel:** <#${row.channel_id}>`,
            `**Timezone:** \`${row.timezone}\``,
            `**Reporter role:** ${reporterRole}`,
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

      case "remind-missing": {
        const row = await getConfig(config, guildId);
        if (!row) {
          return ephemeral(
            "No configuration yet. Run `/standup-config set` first.",
          );
        }

        if (!row.reporter_role_id) {
          return ephemeral(
            "No reporter role configured. Run `/standup set-reporter-role` first.",
          );
        }

        const token = interaction.token;
        if (!token) {
          return ephemeral("Missing interaction token; try again.");
        }

        const applicationId =
          interaction.application_id ?? config.discordApplicationId;
        const target = configRowToTarget(row);

        void runRemindMissingAndFollowUp(
          config,
          applicationId,
          token,
          target,
        );

        return deferredEphemeral();
      }

      case "summarize": {
        const row = await getConfig(config, guildId);
        if (!row) {
          return ephemeral(
            "No configuration yet. Run `/standup-config set` first.",
          );
        }

        const token = interaction.token;
        if (!token) {
          return ephemeral("Missing interaction token; try again.");
        }

        const applicationId =
          interaction.application_id ?? config.discordApplicationId;
        const target = configRowToTarget(row);

        const dateOption = getSubcommandOption(interaction, "date");
        const { dateString, usedFallback } = resolveSummarizeDate(
          row.timezone,
          dateOption,
        );
        const window = getCalendarDayWindow(row.timezone, dateString);

        void runSummarizeAndFollowUp(
          config,
          applicationId,
          token,
          target,
          row.timezone,
          { window, summaryDate: dateString },
          usedFallback,
        );

        return deferredEphemeral();
      }

      default:
        return ephemeral("Unknown subcommand.");
    }
  } catch (error) {
    return ephemeral(formatUserFacingDiscordError(error));
  }
}
