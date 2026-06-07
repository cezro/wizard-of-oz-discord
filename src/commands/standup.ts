import type { AppConfig } from "../config.js";
import { editDeferredInteraction } from "../discord/interaction-followup.js";
import {
  deferredEphemeral,
  deferredMessage,
  ephemeral,
  getSubcommand,
  getSubcommandIntegerOption,
  requireGuild,
  type DiscordInteraction,
  type InteractionResponse,
} from "../discord/interaction-utils.js";
import { requireManageGuild } from "../discord/permissions.js";
import { runPipeline, type RunPipelineOptions } from "../pipeline.js";
import { runMissingReporterNudge } from "../standup/missing-reporters.js";
import { runDailyReminder } from "../standup/reminder.js";
import { configRowToTarget, getConfig } from "../storage/config-store.js";
import type { InvalidCheckIn, StandupTarget } from "../types.js";
import { formatUserFacingDiscordError } from "../utils/discord-api.js";
import {
  getCalendarDayWindow,
  resolveSummarizeDateParts,
} from "../utils/timezone.js";

async function runSummarizeAndFollowUp(
  config: AppConfig,
  applicationId: string,
  interactionToken: string,
  target: StandupTarget,
  timezone: string,
  pipelineOptions: RunPipelineOptions,
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
    await editDeferredInteraction(
      applicationId,
      interactionToken,
      lines.join("\n"),
    );
  } catch (error) {
    await editDeferredInteraction(
      applicationId,
      interactionToken,
      formatUserFacingDiscordError(error, "channel"),
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

function formatStandupHelp(): string {
  return [
    "**Standup bot commands**",
    "",
    "**/standup help** — Show this reference.",
    "",
    "**/standup start** — Force-post the daily DSM reminder. Does not update `last_reminder_date`.",
    "Requires **Manage Server**.",
    "",
    "**/standup summarize** [month] [day] [year] — Force-run the summary pipeline for a calendar day in the guild timezone. Omitted date parts default to today.",
    "Requires standup configuration (see `/standup-config`).",
    "",
    "**/standup remind-missing** — Nudge reporters who have not posted a valid check-in in the rolling 24-hour window.",
    "Requires a reporter role configured in `/standup-config`.",
    "",
    "**/standup-config** — Interactive hub: channel, timezone, schedule, active weekdays, reporter role, enable/disable.",
    "Requires **Manage Server**. Set this up before using manual `/standup` actions.",
  ].join("\n");
}

export async function handleStandupCommand(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const guildResult = requireGuild(interaction);
  if (!guildResult.ok) return guildResult.response;
  const { guildId } = guildResult;

  const subcommand = getSubcommand(interaction);

  try {
    switch (subcommand) {
      case "start": {
        if (!requireManageGuild(interaction)) {
          return ephemeral(
            "You need **Manage Server** permission to use this command.",
          );
        }

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
      }

      case "remind-missing": {
        const row = await getConfig(config, guildId);
        if (!row) {
          return ephemeral(
            "No configuration yet. Run `/standup-config` first.",
          );
        }

        if (!row.reporter_role_id) {
          return ephemeral(
            "No reporter role configured. Set one in `/standup-config` → Reporter role.",
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
            "No configuration yet. Run `/standup-config` first.",
          );
        }

        const resolved = resolveSummarizeDateParts(row.timezone, {
          month: getSubcommandIntegerOption(interaction, "month"),
          day: getSubcommandIntegerOption(interaction, "day"),
          year: getSubcommandIntegerOption(interaction, "year"),
        });
        if (!resolved.ok) {
          return ephemeral(resolved.error);
        }

        const channelId = interaction.channel_id;
        if (!channelId) {
          return ephemeral("Missing channel context; try again in a server channel.");
        }

        const token = interaction.token;
        if (!token) {
          return ephemeral("Missing interaction token; try again.");
        }

        const applicationId =
          interaction.application_id ?? config.discordApplicationId;
        const target = configRowToTarget(row);
        const window = getCalendarDayWindow(row.timezone, resolved.dateString);

        void runSummarizeAndFollowUp(
          config,
          applicationId,
          token,
          target,
          row.timezone,
          {
            window,
            summaryDate: resolved.dateString,
            broadcastChannelId: channelId,
          },
        );

        return deferredMessage();
      }

      case "help":
        return ephemeral(formatStandupHelp());

      default:
        return ephemeral("Unknown subcommand.");
    }
  } catch (error) {
    return ephemeral(formatUserFacingDiscordError(error));
  }
}
