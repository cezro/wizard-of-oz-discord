import type { AppConfig } from "../config.js";
import { fetchMemberIdsWithRole } from "../discord/guild-members.js";
import { broadcastMissingReporterNudge } from "../egress/discord.js";
import { ingestStandupMessages } from "../ingestion/discord.js";
import type { StandupTarget } from "../types.js";
import { discordJson } from "../utils/discord-api.js";
import { getStandupWindow } from "../utils/timezone.js";

export interface MissingReporterNudgeResult {
  missingCount: number;
  posted: boolean;
  expectedCount: number;
}

export function getPostedAuthorIds(
  messages: { authorId: string }[],
): Set<string> {
  return new Set(messages.map((m) => m.authorId));
}

export function findMissingReporterIds(
  expectedIds: string[],
  postedIds: Set<string>,
): string[] {
  return expectedIds.filter((id) => !postedIds.has(id));
}

export async function runMissingReporterNudge(
  config: AppConfig,
  target: StandupTarget,
): Promise<MissingReporterNudgeResult> {
  if (!target.reporterRoleId) {
    throw new Error(
      "No reporter role configured. Run /standup set-reporter-role first.",
    );
  }

  const window = getStandupWindow(target.timezone);
  const data = await ingestStandupMessages(config, target, window);
  const postedIds = getPostedAuthorIds(data.messages);

  const expectedIds = await getExpectedReporterIds(
    config,
    target.guildId,
    target.reporterRoleId,
  );

  const missingIds = findMissingReporterIds(expectedIds, postedIds);

  if (missingIds.length === 0) {
    return {
      missingCount: 0,
      posted: false,
      expectedCount: expectedIds.length,
    };
  }

  await broadcastMissingReporterNudge(config, target.channelId, missingIds);

  return {
    missingCount: missingIds.length,
    posted: true,
    expectedCount: expectedIds.length,
  };
}

async function getExpectedReporterIds(
  config: AppConfig,
  guildId: string,
  roleId: string,
): Promise<string[]> {
  const botUserId = await getBotUserId(config);
  return fetchMemberIdsWithRole(
    config.discordBotToken,
    guildId,
    roleId,
    botUserId,
  );
}

let cachedBotUserId: string | null = null;

async function getBotUserId(config: AppConfig): Promise<string | undefined> {
  if (cachedBotUserId) return cachedBotUserId;

  const user = await discordJson<{ id: string }>(
    config.discordBotToken,
    "/users/@me",
  );
  cachedBotUserId = user.id;
  return user.id;
}
