import type { AppConfig } from "../config.js";
import type {
  DiscordRawMessage,
  InvalidCheckIn,
  StandupPipelineData,
  StandupTarget,
} from "../types.js";
import { truncateCheckInPreview } from "../utils/dsm-validation.js";
import { discordJson } from "../utils/discord-api.js";
import {
  isEligibleStandupMessage,
  shouldIncludeMessage,
  stripEmojiMarkup,
  toSanitizedMessage,
} from "../utils/sanitize.js";
import { isWithinWindow, type StandupWindow } from "../utils/timezone.js";

const PAGE_SIZE = 100;

export interface IngestStandupOptions {
  /** When set, invalidCheckIns only includes these author IDs. */
  expectedReporterIds?: string[];
}

export async function ingestStandupMessages(
  config: AppConfig,
  target: StandupTarget,
  window: StandupWindow,
  options?: IngestStandupOptions,
): Promise<StandupPipelineData> {
  const rawMessages = await fetchChannelMessages(
    config.discordBotToken,
    target.channelId,
    window,
  );

  const messages = rawMessages
    .filter(shouldIncludeMessage)
    .map(toSanitizedMessage)
    .filter((m) => isWithinWindow(m.createdAt, window))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const expectedSet = options?.expectedReporterIds
    ? new Set(options.expectedReporterIds)
    : undefined;

  const invalidCheckIns = expectedSet
    ? collectInvalidCheckIns(rawMessages, messages, expectedSet)
    : [];

  return {
    channelId: target.channelId,
    windowStart: window.windowStart,
    windowEnd: window.windowEnd,
    messages,
    invalidCheckIns,
  };
}

function collectInvalidCheckIns(
  rawMessages: DiscordRawMessage[],
  validMessages: { authorId: string }[],
  expectedAuthorIds?: Set<string>,
): InvalidCheckIn[] {
  const validAuthorIds = new Set(validMessages.map((m) => m.authorId));
  const invalidByAuthor = new Map<string, string>();

  for (const raw of rawMessages) {
    if (!isEligibleStandupMessage(raw)) continue;
    if (shouldIncludeMessage(raw)) continue;
    if (validAuthorIds.has(raw.author.id)) continue;
    if (expectedAuthorIds && !expectedAuthorIds.has(raw.author.id)) continue;
    if (!hasCheckInAttempt(raw)) continue;

    invalidByAuthor.set(
      raw.author.id,
      truncateCheckInPreview(raw.content.trim() || "(empty message)"),
    );
  }

  return [...invalidByAuthor.entries()].map(([authorId, preview]) => ({
    authorId,
    preview,
  }));
}

function hasCheckInAttempt(message: DiscordRawMessage): boolean {
  if (message.attachments?.length) return true;
  return stripEmojiMarkup(message.content).length > 0;
}

async function fetchChannelMessages(
  token: string,
  channelId: string,
  window: StandupWindow,
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
      if (!isWithinWindow(createdAt, window)) {
        if (createdAt < window.windowStart) reachedWindowStart = true;
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
