import type { AppConfig } from "../config.js";
import { runStandupTick } from "./standup-tick.js";

const TICK_MS = 60_000;

/** Default on unless explicitly disabled (false / 0 / no). */
export function isInternalSchedulerEnabled(): boolean {
  const raw = process.env.STANDUP_INTERNAL_SCHEDULER?.trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "no";
}

function runTick(config: AppConfig): void {
  const startedAt = Date.now();
  runStandupTick(config)
    .then((result) => {
      const elapsed = Date.now() - startedAt;
      if (result.skipped) return;
      console.log(`[cron/standup] tick finished in ${elapsed}ms`);
    })
    .catch((error) => {
      console.error("[scheduler/standup]", error);
    });
}

/**
 * Runs standup reminders, nudges, and summaries every minute (aligned to wall clock).
 * Returns a stop function for graceful shutdown.
 */
export function startInternalScheduler(config: AppConfig): () => void {
  const msUntilNextMinute = TICK_MS - (Date.now() % TICK_MS);
  let interval: ReturnType<typeof setInterval> | null = null;

  const alignTimer = setTimeout(() => {
    runTick(config);
    interval = setInterval(() => runTick(config), TICK_MS);
  }, msUntilNextMinute);

  console.log(
    `[scheduler] internal standup tick enabled (every ${TICK_MS / 1000}s, first aligned tick in ${Math.ceil(msUntilNextMinute / 1000)}s)`,
  );

  return () => {
    clearTimeout(alignTimer);
    if (interval) clearInterval(interval);
  };
}
