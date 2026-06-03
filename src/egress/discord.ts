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

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  footer?: { text: string };
}

export async function broadcastReminder(
  config: AppConfig,
  channelId: string,
): Promise<void> {
  await postChannelMessage(config, channelId, {
    content: REMINDER_MESSAGE,
  });
}

export async function broadcastResult(
  config: AppConfig,
  target: StandupTarget,
  result: ProcessResult,
): Promise<"empty" | "summary"> {
  if (result.kind === "empty") {
    await postChannelMessage(config, target.channelId, {
      content: EMPTY_DAY_MESSAGE,
    });
    return "empty";
  }

  const { description, truncated } = truncateEmbedDescription(result.markdown);

  const embed: DiscordEmbed = {
    title: `📊 Daily Standup Summary - ${formatDateInTimezone(target.timezone)}`,
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
  body: { content?: string; embeds?: DiscordEmbed[] },
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
