import type { AppConfig } from "./config.js";
import { resolveStandupTargets } from "./config.js";
import { broadcastResult } from "./egress/discord.js";
import { ingestStandupMessages } from "./ingestion/discord.js";
import { processStandup } from "./processing/gemini.js";
import type { PipelineResult, StandupTarget } from "./types.js";
import { buildAuthorDisplayNameMap } from "./utils/markdown-export.js";
import {
  dateStringToReferenceDate,
  getCalendarDayWindow,
  getLocalTimeParts,
  type StandupWindow,
} from "./utils/timezone.js";

export interface GuildPipelineResult extends PipelineResult {
  guildId: string;
  channelId: string;
}

export interface AllPipelinesResult {
  results: GuildPipelineResult[];
}

export interface RunPipelineOptions {
  window?: StandupWindow;
  /** YYYY-MM-DD for embed title when summarizing a chosen calendar day */
  summaryDate?: string;
  /** Post summary here instead of the configured standup channel (ingestion unchanged). */
  broadcastChannelId?: string;
}

export async function runPipeline(
  config: AppConfig,
  target: StandupTarget,
  options?: RunPipelineOptions,
): Promise<GuildPipelineResult> {
  const todayDateString = getLocalTimeParts(target.timezone).dateString;
  const summaryDate = options?.summaryDate ?? todayDateString;
  const window =
    options?.window ??
    getCalendarDayWindow(target.timezone, summaryDate);
  const data = await ingestStandupMessages(config, target, window);
  const processed = await processStandup(config, data);
  const titleDate = dateStringToReferenceDate(target.timezone, summaryDate);
  const authorDisplayNames = buildAuthorDisplayNameMap(data.messages);
  const broadcastTarget = options?.broadcastChannelId
    ? { ...target, channelId: options.broadcastChannelId }
    : target;
  const posted = await broadcastResult(config, broadcastTarget, processed, {
    titleDate,
    authorDisplayNames,
  });

  return {
    guildId: target.guildId,
    channelId: broadcastTarget.channelId,
    messageCount: data.messages.length,
    posted,
  };
}

export async function runAllPipelines(
  config: AppConfig,
): Promise<AllPipelinesResult> {
  const targets = await resolveStandupTargets(config);
  const results: GuildPipelineResult[] = [];

  for (const target of targets) {
    results.push(await runPipeline(config, target));
  }

  return { results };
}
