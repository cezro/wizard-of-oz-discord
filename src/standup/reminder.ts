import type { AppConfig } from "../config.js";
import { broadcastReminder } from "../egress/discord.js";
import type { StandupTarget } from "../types.js";
import { getExpectedReporterIds } from "./missing-reporters.js";

export interface DailyReminderResult {
  pingedCount: number;
}

export async function runDailyReminder(
  config: AppConfig,
  target: StandupTarget,
): Promise<DailyReminderResult> {
  if (!target.reporterRoleId) {
    await broadcastReminder(config, target.channelId);
    return { pingedCount: 0 };
  }

  const reporterUserIds = await getExpectedReporterIds(
    config,
    target.guildId,
    target.reporterRoleId,
  );

  await broadcastReminder(config, target.channelId, reporterUserIds);

  return { pingedCount: reporterUserIds.length };
}
