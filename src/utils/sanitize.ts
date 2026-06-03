import type { DiscordRawMessage, SanitizedMessage } from "../types.js";

const CUSTOM_EMOJI_PATTERN = /<a?:\w+:\d+>/g;
const UNICODE_EMOJI_PATTERN =
  /[\p{Extended_Pictographic}\p{Emoji_Component}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu;

function stripEmojiMarkup(content: string): string {
  return content
    .replace(CUSTOM_EMOJI_PATTERN, "")
    .replace(UNICODE_EMOJI_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasMeaningfulText(content: string): boolean {
  const stripped = stripEmojiMarkup(content);
  if (!stripped) return false;
  return /\w/.test(stripped);
}

export function shouldIncludeMessage(message: DiscordRawMessage): boolean {
  if (message.type !== 0) return false;
  if (message.author.bot) return false;
  if (!hasMeaningfulText(message.content)) return false;
  return true;
}

function resolveAuthorDisplayName(message: DiscordRawMessage): string {
  const nick = message.member?.nick?.trim();
  if (nick) return nick;

  const globalName = message.author.global_name?.trim();
  if (globalName) return globalName;

  return message.author.username;
}

export function toSanitizedMessage(message: DiscordRawMessage): SanitizedMessage {
  return {
    id: message.id,
    authorId: message.author.id,
    authorMention: `<@${message.author.id}>`,
    authorDisplayName: resolveAuthorDisplayName(message),
    content: message.content.trim(),
    createdAt: new Date(message.timestamp),
  };
}
