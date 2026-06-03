import type { AppConfig } from "../config.js";
import type { ProcessResult, StandupTarget } from "../types.js";
import { discordJson } from "../utils/discord-api.js";
import { formatDateInTimezone } from "../utils/timezone.js";

const EMBED_COLOR = 0x5865f2;
const EMBED_DESCRIPTION_LIMIT = 4096;
const EMPTY_DAY_MESSAGE =
  "No standup updates recorded for today! Hope everyone had a productive day.";
const REMINDER_MESSAGE =
  "**Daily Standup Reminder** — Please post your async DSM update in this channel.";
const MISSING_NUDGE_PREFIX =
  "**End of Day DSM Reminder** — Please post your async DSM update. Still waiting on: ";
const DISCORD_CONTENT_LIMIT = 2000;

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  footer?: { text: string };
}

interface AllowedMentions {
  parse?: ("users" | "roles" | "everyone")[];
  users?: string[];
}

interface ChannelMessageBody {
  content?: string;
  embeds?: DiscordEmbed[];
  allowed_mentions?: AllowedMentions;
}

const MAX_ALLOWED_USER_MENTIONS = 100;

export async function broadcastReminder(
  config: AppConfig,
  channelId: string,
): Promise<void> {
  await postChannelMessage(config, channelId, {
    content: REMINDER_MESSAGE,
  });
}

export async function broadcastMissingReporterNudge(
  config: AppConfig,
  channelId: string,
  missingUserIds: string[],
): Promise<void> {
  const chunks = chunkMentionMessages(missingUserIds);
  for (const chunk of chunks) {
    await postChannelMessage(config, channelId, {
      content: chunk.content,
      allowed_mentions: {
        parse: [],
        users: chunk.userIds,
      },
    });
  }
}

function chunkMentionMessages(
  userIds: string[],
): { content: string; userIds: string[] }[] {
  const messages: { content: string; userIds: string[] }[] = [];
  let currentIds: string[] = [];

  for (const id of userIds) {
    const candidateIds = [...currentIds, id];
    const content = buildMissingNudgeContent(candidateIds);
    const overCharLimit =
      content.length > DISCORD_CONTENT_LIMIT && currentIds.length > 0;
    const overMentionLimit =
      candidateIds.length > MAX_ALLOWED_USER_MENTIONS && currentIds.length > 0;

    if (overCharLimit || overMentionLimit) {
      messages.push({
        content: buildMissingNudgeContent(currentIds),
        userIds: [...currentIds],
      });
      currentIds = [id];
    } else {
      currentIds = candidateIds;
    }
  }

  if (currentIds.length > 0) {
    messages.push({
      content: buildMissingNudgeContent(currentIds),
      userIds: [...currentIds],
    });
  }

  return messages;
}

function buildMissingNudgeContent(userIds: string[]): string {
  const mentions = userIds.map((id) => `<@${id}>`).join(" ");
  return MISSING_NUDGE_PREFIX + mentions;
}

export async function broadcastResult(
  config: AppConfig,
  target: StandupTarget,
  result: ProcessResult,
  opts?: { titleDate?: Date },
): Promise<"empty" | "summary"> {
  if (result.kind === "empty") {
    await postChannelMessage(config, target.channelId, {
      content: EMPTY_DAY_MESSAGE,
    });
    return "empty";
  }

  const { description, truncated } = truncateEmbedDescription(result.markdown);

  const embed: DiscordEmbed = {
    title: `📊 Daily Standup Summary - ${formatDateInTimezone(target.timezone, opts?.titleDate ?? new Date())}`,
    description,
    color: EMBED_COLOR,
  };

  if (truncated) {
    embed.footer = { text: "Summary truncated due to Discord embed limits." };
  }

  await postChannelMessage(config, target.channelId, { embeds: [embed] });
  return "summary";
}

function truncateEmbedDescription(markdown: string): {
  description: string;
  truncated: boolean;
} {
  if (markdown.length <= EMBED_DESCRIPTION_LIMIT) {
    return { description: markdown, truncated: false };
  }

  const suffix = "\n\n… _(truncated)_";
  const maxLen = EMBED_DESCRIPTION_LIMIT - suffix.length;
  return {
    description: markdown.slice(0, maxLen) + suffix,
    truncated: true,
  };
}

async function postChannelMessage(
  config: AppConfig,
  channelId: string,
  body: ChannelMessageBody,
): Promise<void> {
  await discordJson(
    config.discordBotToken,
    `/channels/${channelId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
