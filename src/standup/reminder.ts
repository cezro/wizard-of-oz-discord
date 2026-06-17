import type { AppConfig } from "../config.js";
import {
  broadcastReminder,
  broadcastReminderWithRole,
} from "../egress/discord.js";
import type { StandupTarget } from "../types.js";

export interface DailyReminderResult {
  pingedCount: number;
  usedRoleMention?: boolean;
}

export async function runDailyReminder(
  config: AppConfig,
  target: StandupTarget,
): Promise<DailyReminderResult> {
  if (!target.reporterRoleId) {
    await broadcastReminder(config, target.channelId);
    return { pingedCount: 0 };
  }

  await broadcastReminderWithRole(
    config,
    target.channelId,
    target.reporterRoleId,
  );

  return { pingedCount: 0, usedRoleMention: true };
}
