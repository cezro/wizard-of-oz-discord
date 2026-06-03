import type { AppConfig } from "../config.js";
import { runPipeline } from "../pipeline.js";
import { runMissingReporterNudge } from "../standup/missing-reporters.js";
import { runDailyReminder } from "../standup/reminder.js";
import {
  getEnabledConfigs,
  markNudgeSent,
  markReminderSent,
  markSummarySent,
} from "../storage/config-store.js";
import type { StandupTarget } from "../types.js";
import {
  getLocalTimeParts,
  matchesSchedule,
  resolveNudgeSchedule,
} from "../utils/timezone.js";

export interface GuildTickResult {
  guildId: string;
  reminderSent: boolean;
  nudgeSent: boolean;
  summaryRan: boolean;
  error?: string;
}

export interface StandupTickResult {
  results: GuildTickResult[];
}

export async function runStandupTick(
  config: AppConfig,
  now: Date = new Date(),
): Promise<StandupTickResult> {
  const targets = await getEnabledConfigs(config);
  const results: GuildTickResult[] = [];

  for (const target of targets) {
    results.push(await processGuildTick(config, target, now));
  }

  return { results };
}

async function processGuildTick(
  config: AppConfig,
  target: StandupTarget,
  now: Date,
): Promise<GuildTickResult> {
  const result: GuildTickResult = {
    guildId: target.guildId,
    reminderSent: false,
    nudgeSent: false,
    summaryRan: false,
  };

  try {
    const local = getLocalTimeParts(target.timezone, now);

    if (
      target.reminderHour !== null &&
      matchesSchedule(
        local.hour,
        local.minute,
        target.reminderHour,
        target.reminderMinute,
      ) &&
      target.lastReminderDate !== local.dateString
    ) {
      await runDailyReminder(config, target);
      await markReminderSent(config, target.guildId, local.dateString);
      result.reminderSent = true;
    }

    const nudgeSchedule = resolveNudgeSchedule(target);
    if (
      target.reporterRoleId &&
      matchesSchedule(
        local.hour,
        local.minute,
        nudgeSchedule.hour,
        nudgeSchedule.minute,
      ) &&
      target.lastNudgeDate !== local.dateString
    ) {
      const nudgeResult = await runMissingReporterNudge(config, target);
      await markNudgeSent(config, target.guildId, local.dateString);
      result.nudgeSent = nudgeResult.posted;
    }

    if (
      matchesSchedule(
        local.hour,
        local.minute,
        target.summaryHour,
        target.summaryMinute,
      ) &&
      target.lastSummaryDate !== local.dateString
    ) {
      await runPipeline(config, target);
      await markSummarySent(config, target.guildId, local.dateString);
      result.summaryRan = true;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    console.error(`[cron/standup] guild ${target.guildId}:`, error);
  }

  return result;
}
