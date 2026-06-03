import type { AppConfig } from "../config.js";
import type { DiscordRawMessage, StandupPipelineData, StandupTarget } from "../types.js";
import { discordJson } from "../utils/discord-api.js";
import { shouldIncludeMessage, toSanitizedMessage } from "../utils/sanitize.js";
import type { StandupWindow } from "../utils/timezone.js";

const PAGE_SIZE = 100;

export async function ingestStandupMessages(
  config: AppConfig,
  target: StandupTarget,
  window: StandupWindow,
): Promise<StandupPipelineData> {
  const rawMessages = await fetchChannelMessages(
    config.discordBotToken,
    target.channelId,
    window.windowStart,
  );

  const messages = rawMessages
    .filter(shouldIncludeMessage)
    .map(toSanitizedMessage)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return {
    channelId: target.channelId,
    windowStart: window.windowStart,
    windowEnd: window.windowEnd,
    messages,
  };
}

async function fetchChannelMessages(
  token: string,
  channelId: string,
  windowStart: Date,
): Promise<DiscordRawMessage[]> {
  const collected: DiscordRawMessage[] = [];
  let before: string | undefined;

  while (true) {
    const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (before) query.set("before", before);

    const page = await discordJson<DiscordRawMessage[]>(
      token,
      `/channels/${channelId}/messages?${query}`,
    );

    if (page.length === 0) break;

    let reachedWindowStart = false;

    for (const message of page) {
      const createdAt = new Date(message.timestamp);
      if (createdAt < windowStart) {
        reachedWindowStart = true;
        continue;
      }
      collected.push(message);
    }

    const oldestInPage = page[page.length - 1];
    if (reachedWindowStart || page.length < PAGE_SIZE) break;

    before = oldestInPage.id;
  }

  return collected;
}
