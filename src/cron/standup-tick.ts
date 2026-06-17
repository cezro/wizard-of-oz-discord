import type { AppConfig } from "../config.js";
import { runPipeline } from "../pipeline.js";
import {
  formatGuildCullMessage,
  GUILD_ACCESS_FAILURE_THRESHOLD,
  isGuildUnreachableError,
} from "../standup/guild-access.js";
import { runMissingReporterNudge } from "../standup/missing-reporters.js";
import { runDailyReminder } from "../standup/reminder.js";
import {
  disableGuildConfig,
  getEnabledConfigs,
  markNudgeSent,
  markReminderSent,
  markSummarySent,
  recordGuildAccessFailure,
  resetGuildAccessFailures,
} from "../storage/config-store.js";
import type { StandupTarget } from "../types.js";
import {
  DiscordApiError,
  formatUserFacingDiscordError,
} from "../utils/discord-api.js";
import { isActiveWeekday } from "../utils/weekdays.js";
import {
  getCalendarDayWindow,
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
  tickTimedOut?: boolean;
  /** Set when the tick was skipped because a previous tick is still running. */
  skipped?: boolean;
}

export interface StandupTickResult {
  results: GuildTickResult[];
  skipped?: boolean;
}

let tickInFlight: Promise<StandupTickResult> | null = null;

const INTER_GUILD_STAGGER_MS = 2000;
const GUILD_TICK_TIMEOUT_MS = 120_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

async function handleGuildAccessFailure(
  config: AppConfig,
  guildId: string,
  error: unknown,
): Promise<void> {
  if (!isGuildUnreachableError(error)) return;

  try {
    const count = await recordGuildAccessFailure(config, guildId);
    if (count >= GUILD_ACCESS_FAILURE_THRESHOLD) {
      await disableGuildConfig(config, guildId, "auto-cull: unknown guild");
      console.warn(formatGuildCullMessage(guildId, count));
    }
  } catch (trackError) {
    console.error(
      `[cron/standup] guild ${guildId} access failure tracking error:`,
      trackError,
    );
  }
}

async function runTickAction(
  config: AppConfig,
  label: string,
  guildId: string,
  fn: () => Promise<void>,
  opts?: { channelId?: string; errorContext?: "channel" },
): Promise<string | undefined> {
  try {
    await fn();
    try {
      await resetGuildAccessFailures(config, guildId);
    } catch (resetError) {
      console.error(
        `[cron/standup] guild ${guildId} failed to reset access failures:`,
        resetError,
      );
    }
    return undefined;
  } catch (error) {
    if (opts?.channelId) {
      console.error(
        `[cron/standup] guild ${guildId} channel ${opts.channelId} ${label}:`,
        error,
      );
    } else {
      console.error(`[cron/standup] guild ${guildId} ${label}:`, error);
    }

    await handleGuildAccessFailure(config, guildId, error);

    if (opts?.errorContext === "channel" && error instanceof DiscordApiError) {
      return formatUserFacingDiscordError(error, "channel");
    }
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
    result.summaryError ||
    result.tickTimedOut;

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
      ...(result.tickTimedOut && { tickTimedOut: true }),
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

  for (let i = 0; i < targets.length; i++) {
    if (i > 0) {
      await sleep(INTER_GUILD_STAGGER_MS);
    }
    const result = await processGuildTickWithTimeout(config, targets[i], now);
    logGuildTickResult(result);
    results.push(result);
  }

  return { results };
}

async function processGuildTickWithTimeout(
  config: AppConfig,
  target: StandupTarget,
  now: Date,
): Promise<GuildTickResult> {
  let timedOut = false;

  const result = await Promise.race([
    processGuildTick(config, target, now),
    sleep(GUILD_TICK_TIMEOUT_MS).then(() => {
      timedOut = true;
      return {
        guildId: target.guildId,
        reminderSent: false,
        nudgeSent: false,
        summaryRan: false,
        tickTimedOut: true,
      } satisfies GuildTickResult;
    }),
  ]);

  if (timedOut) {
    console.error(
      `[cron/standup] guild ${target.guildId} tick timed out after ${GUILD_TICK_TIMEOUT_MS / 1000}s`,
    );
  }

  return result;
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

  if (target.accessFailureCount >= GUILD_ACCESS_FAILURE_THRESHOLD) {
    return result;
  }

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
      config,
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
      config,
      "nudge",
      target.guildId,
      async () => {
        const nudgeResult = await runMissingReporterNudge(config, target, {
          dateString: local.dateString,
        });
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
      config,
      "summary",
      target.guildId,
      async () => {
        await runPipeline(config, target, {
          window: getCalendarDayWindow(target.timezone, local.dateString),
          summaryDate: local.dateString,
        });
        await markSummarySent(config, target.guildId, local.dateString);
      },
      { channelId: target.channelId, errorContext: "channel" },
    );
    if (summaryError) {
      result.summaryError = summaryError;
    } else {
      result.summaryRan = true;
    }
  }

  return result;
}
