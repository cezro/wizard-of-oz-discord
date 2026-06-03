import type { SanitizedMessage } from "../types.js";

const USER_MENTION_PATTERN = /<@!?(\d+)>/g;

export function buildAuthorDisplayNameMap(
  messages: SanitizedMessage[],
): Map<string, string> {
  const names = new Map<string, string>();
  for (const message of messages) {
    names.set(message.authorId, message.authorDisplayName);
  }
  return names;
}

export function markdownForFileExport(
  markdown: string,
  names: Map<string, string>,
): string {
  return markdown.replace(USER_MENTION_PATTERN, (_, userId: string) => {
    const name = names.get(userId);
    return name ? `@${name}` : `@user-${userId}`;
  });
}
