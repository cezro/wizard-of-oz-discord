import type { AppConfig } from "../config.js";
import {
  completeDeferredInteraction,
  editDeferredInteraction,
} from "../discord/interaction-followup.js";
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
import type { InvalidCheckIn } from "../types.js";
import { formatUserFacingDiscordError } from "../utils/discord-api.js";
import {
  getCalendarDayWindow,
  resolveSummarizeDateParts,
  type SummarizeDateParts,
} from "../utils/timezone.js";
import { withTimeout } from "../utils/with-timeout.js";

const COMMAND_FOLLOWUP_TIMEOUT_MS = 90_000;

async function runStartAndFollowUp(
  config: AppConfig,
  applicationId: string,
  interactionToken: string,
  guildId: string,
): Promise<void> {
  try {
    await withTimeout(
      runStartAndFollowUpInner(
        config,
        applicationId,
        interactionToken,
        guildId,
      ),
      COMMAND_FOLLOWUP_TIMEOUT_MS,
      `Timed out after ${COMMAND_FOLLOWUP_TIMEOUT_MS / 1000}s — check Render logs`,
    );
  } catch (error) {
    await completeDeferredInteraction(
      applicationId,
      interactionToken,
      error instanceof Error ? error.message : "Something went wrong.",
    );
  }
}

async function runStartAndFollowUpInner(
  config: AppConfig,
  applicationId: string,
  interactionToken: string,
  guildId: string,
): Promise<void> {
  try {
    console.log(`[standup/start] guild ${guildId} loading config`);
    const row = await getConfig(config, guildId);
    if (!row) {
      await completeDeferredInteraction(
        applicationId,
        interactionToken,
        "No configuration yet. Run `/standup-config` first.",
      );
      return;
    }

    const target = configRowToTarget(row);
    await editDeferredInteraction(
      applicationId,
      interactionToken,
      "Posting reminder…",
    );

    console.log(`[standup/start] guild ${guildId} posting reminder`);
    const { usedRoleMention } = await runDailyReminder(config, target);
    const pingNote = usedRoleMention
      ? " Mentioned the reporter role."
      : " No reporter role configured — text only.";

    await completeDeferredInteraction(
      applicationId,
      interactionToken,
      `Daily DSM reminder posted to <#${row.channel_id}>.${pingNote} (Cron \`last_reminder_date\` was not updated.)`,
    );
    console.log(`[standup/start] guild ${guildId} done`);
  } catch (error) {
    await completeDeferredInteraction(
      applicationId,
      interactionToken,
      formatUserFacingDiscordError(error),
    );
  }
}

async function runSummarizeAndFollowUp(
  config: AppConfig,
  applicationId: string,
  interactionToken: string,
  guildId: string,
  channelId: string,
  dateOptions: SummarizeDateParts,
): Promise<void> {
  try {
    await withTimeout(
      runSummarizeAndFollowUpInner(
        config,
        applicationId,
        interactionToken,
        guildId,
        channelId,
        dateOptions,
      ),
      COMMAND_FOLLOWUP_TIMEOUT_MS,
      `Timed out after ${COMMAND_FOLLOWUP_TIMEOUT_MS / 1000}s — check Render logs`,
    );
  } catch (error) {
    await completeDeferredInteraction(
      applicationId,
      interactionToken,
      error instanceof Error
        ? error.message
        : formatUserFacingDiscordError(error, "channel"),
      { ephemeral: false },
    );
  }
}

async function runSummarizeAndFollowUpInner(
  config: AppConfig,
  applicationId: string,
  interactionToken: string,
  guildId: string,
  channelId: string,
  dateOptions: SummarizeDateParts,
): Promise<void> {
  try {
    console.log(`[standup/summarize] guild ${guildId} loading config`);
    const row = await getConfig(config, guildId);
    if (!row) {
      await completeDeferredInteraction(
        applicationId,
        interactionToken,
        "No configuration yet. Run `/standup-config` first.",
        { ephemeral: false },
      );
      return;
    }

    const resolved = resolveSummarizeDateParts(row.timezone, dateOptions);
    if (!resolved.ok) {
      await completeDeferredInteraction(
        applicationId,
        interactionToken,
        resolved.error,
        { ephemeral: false },
      );
      return;
    }

    const target = configRowToTarget(row);
    const pipelineOptions: RunPipelineOptions = {
      window: getCalendarDayWindow(row.timezone, resolved.dateString),
      summaryDate: resolved.dateString,
      broadcastChannelId: channelId,
    };

    console.log(`[standup/summarize] guild ${guildId} running pipeline`);
    const result = await runPipeline(config, target, pipelineOptions);
    const lines = [
      "Summary pipeline completed.",
      `**Date:** ${pipelineOptions.summaryDate} (\`${row.timezone}\`)`,
      `**Messages ingested:** ${result.messageCount}`,
      `**Posted:** ${result.posted}`,
      `**Channel:** <#${result.channelId}>`,
    ];
    await completeDeferredInteraction(
      applicationId,
      interactionToken,
      lines.join("\n"),
      { ephemeral: false },
    );
    console.log(`[standup/summarize] guild ${guildId} done`);
  } catch (error) {
    await completeDeferredInteraction(
      applicationId,
      interactionToken,
      formatUserFacingDiscordError(error, "channel"),
      { ephemeral: false },
    );
  }
}

async function runRemindMissingAndFollowUp(
  config: AppConfig,
  applicationId: string,
  interactionToken: string,
  guildId: string,
): Promise<void> {
  try {
    await withTimeout(
      runRemindMissingAndFollowUpInner(
        config,
        applicationId,
        interactionToken,
        guildId,
      ),
      COMMAND_FOLLOWUP_TIMEOUT_MS,
      `Timed out after ${COMMAND_FOLLOWUP_TIMEOUT_MS / 1000}s — check Render logs`,
    );
  } catch (error) {
    await completeDeferredInteraction(
      applicationId,
      interactionToken,
      error instanceof Error
        ? error.message
        : formatUserFacingDiscordError(error),
    );
  }
}

async function runRemindMissingAndFollowUpInner(
  config: AppConfig,
  applicationId: string,
  interactionToken: string,
  guildId: string,
): Promise<void> {
  try {
    console.log(`[standup/remind-missing] guild ${guildId} loading config`);
    const row = await getConfig(config, guildId);
    if (!row) {
      await completeDeferredInteraction(
        applicationId,
        interactionToken,
        "No configuration yet. Run `/standup-config` first.",
      );
      return;
    }

    if (!row.reporter_role_id) {
      await completeDeferredInteraction(
        applicationId,
        interactionToken,
        "No reporter role configured. Set one in `/standup-config` → Reporter role.",
      );
      return;
    }

    const target = configRowToTarget(row);
    console.log(`[standup/remind-missing] guild ${guildId} running nudge`);
    const result = await runMissingReporterNudge(config, target);
    await completeDeferredInteraction(
      applicationId,
      interactionToken,
      formatRemindMissingReply(result, target.channelId),
    );
    console.log(`[standup/remind-missing] guild ${guildId} done`);
  } catch (error) {
    await completeDeferredInteraction(
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
      "Everyone with the reporter role has posted a valid DSM today (guild timezone).",
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
    "**/standup remind-missing** — Nudge reporters who have not posted a valid check-in today (guild timezone).",
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

        const token = interaction.token;
        if (!token) {
          return ephemeral("Missing interaction token; try again.");
        }

        const applicationId =
          interaction.application_id ?? config.discordApplicationId;

        void runStartAndFollowUp(config, applicationId, token, guildId);
        return deferredEphemeral();
      }

      case "remind-missing": {
        const token = interaction.token;
        if (!token) {
          return ephemeral("Missing interaction token; try again.");
        }

        const applicationId =
          interaction.application_id ?? config.discordApplicationId;

        void runRemindMissingAndFollowUp(
          config,
          applicationId,
          token,
          guildId,
        );

        return deferredEphemeral();
      }

      case "summarize": {
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

        void runSummarizeAndFollowUp(
          config,
          applicationId,
          token,
          guildId,
          channelId,
          {
            month: getSubcommandIntegerOption(interaction, "month"),
            day: getSubcommandIntegerOption(interaction, "day"),
            year: getSubcommandIntegerOption(interaction, "year"),
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
