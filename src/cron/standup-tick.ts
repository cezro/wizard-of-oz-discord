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
import { isActiveWeekday } from "../utils/weekdays.js";
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
  reminderError?: string;
  nudgeError?: string;
  summaryError?: string;
  /** Set when the tick was skipped because a previous tick is still running. */
  skipped?: boolean;
}

export interface StandupTickResult {
  results: GuildTickResult[];
  skipped?: boolean;
}

let tickInFlight: Promise<StandupTickResult> | null = null;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

async function runTickAction(
  label: string,
  guildId: string,
  fn: () => Promise<void>,
): Promise<string | undefined> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    console.error(`[cron/standup] guild ${guildId} ${label}:`, error);
    return errorMessage(error);
  }
}

function logGuildTickResult(result: GuildTickResult): void {
  const hasActivity =
    result.reminderSent ||
    result.nudgeSent ||
    result.summaryRan ||
    result.reminderError ||
    result.nudgeError ||
    result.summaryError;

  if (!hasActivity) return;

  console.log(
    `[cron/standup] guild ${result.guildId}`,
    JSON.stringify({
      reminderSent: result.reminderSent,
      nudgeSent: result.nudgeSent,
      summaryRan: result.summaryRan,
      ...(result.reminderError && { reminderError: result.reminderError }),
      ...(result.nudgeError && { nudgeError: result.nudgeError }),
      ...(result.summaryError && { summaryError: result.summaryError }),
    }),
  );
}

export async function runStandupTick(
  config: AppConfig,
  now: Date = new Date(),
): Promise<StandupTickResult> {
  if (tickInFlight) {
    console.warn("[cron/standup] tick skipped, previous still running");
    return { results: [], skipped: true };
  }

  const run = runStandupTickInner(config, now).finally(() => {
    tickInFlight = null;
  });
  tickInFlight = run;
  return run;
}

async function runStandupTickInner(
  config: AppConfig,
  now: Date,
): Promise<StandupTickResult> {
  const targets = await getEnabledConfigs(config);
  const results: GuildTickResult[] = [];

  for (const target of targets) {
    const result = await processGuildTick(config, target, now);
    logGuildTickResult(result);
    results.push(result);
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

  if (!isActiveWeekday(target.activeWeekdays, target.timezone, now)) {
    return result;
  }

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
    const reminderError = await runTickAction(
      "reminder",
      target.guildId,
      async () => {
        await runDailyReminder(config, target);
        await markReminderSent(config, target.guildId, local.dateString);
      },
    );
    if (reminderError) {
      result.reminderError = reminderError;
    } else {
      result.reminderSent = true;
    }
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
    const nudgeError = await runTickAction(
      "nudge",
      target.guildId,
      async () => {
        const nudgeResult = await runMissingReporterNudge(config, target);
        if (nudgeResult.posted) {
          await markNudgeSent(config, target.guildId, local.dateString);
          result.nudgeSent = true;
        }
      },
    );
    if (nudgeError) {
      result.nudgeError = nudgeError;
    }
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
    const summaryError = await runTickAction(
      "summary",
      target.guildId,
      async () => {
        await runPipeline(config, target);
        await markSummarySent(config, target.guildId, local.dateString);
      },
    );
    if (summaryError) {
      result.summaryError = summaryError;
    } else {
      result.summaryRan = true;
    }
  }

  return result;
}
