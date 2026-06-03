import type { DiscordRawMessage, SanitizedMessage } from "../types.js";
import { isValidDsmCheckIn } from "./dsm-validation.js";

export { stripEmojiMarkup } from "./dsm-validation.js";

export function shouldIncludeMessage(message: DiscordRawMessage): boolean {
  if (message.type !== 0) return false;
  if (message.author.bot) return false;
  if (message.attachments?.length) return true;
  return isValidDsmCheckIn(message.content);
}

export function isEligibleStandupMessage(message: DiscordRawMessage): boolean {
  return message.type === 0 && !message.author.bot;
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
