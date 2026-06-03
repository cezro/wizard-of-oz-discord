import type { AppConfig } from "../config.js";
import { editDeferredInteraction } from "../discord/interaction-followup.js";
import {
  deferredEphemeral,
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

  const subcommand = getSubcommand(interaction);

  try {
    switch (subcommand) {
      case "remind-missing": {
        const row = await getConfig(config, guildId);
        if (!row) {
          return ephemeral(
            "No configuration yet. Run `/standup-config set` first.",
          );
        }

        if (!row.reporter_role_id) {
          return ephemeral(
            "No reporter role configured. Run `/standup-config set-reporter-role` first.",
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

        const resolved = resolveSummarizeDateParts(row.timezone, {
          month: getSubcommandIntegerOption(interaction, "month"),
          day: getSubcommandIntegerOption(interaction, "day"),
          year: getSubcommandIntegerOption(interaction, "year"),
        });
        if (!resolved.ok) {
          return ephemeral(resolved.error);
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
          { window, summaryDate: resolved.dateString },
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
