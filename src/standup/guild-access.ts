import { DiscordApiError } from "../utils/discord-api.js";

/** Discord API code: Unknown Guild — bot removed or never joined. */
const UNKNOWN_GUILD_CODE = 10004;

/** Discord API code: Missing Access — channel permission issue (not a guild cull signal). */
const MISSING_ACCESS_CODE = 50001;

export const GUILD_ACCESS_FAILURE_THRESHOLD = 5;

export type TickErrorKind = "guild_unreachable" | "channel_access" | "other";

interface DiscordErrorBody {
  code?: number;
  message?: string;
}

function discordErrorCode(error: unknown): number | undefined {
  if (!(error instanceof DiscordApiError)) return undefined;
  const body = error.body as DiscordErrorBody | undefined;
  return body?.code;
}

export function isGuildUnreachableError(error: unknown): boolean {
  return discordErrorCode(error) === UNKNOWN_GUILD_CODE;
}

export function classifyTickError(error: unknown): TickErrorKind {
  const code = discordErrorCode(error);
  if (code === UNKNOWN_GUILD_CODE) return "guild_unreachable";
  if (code === MISSING_ACCESS_CODE) return "channel_access";
  return "other";
}

export function formatGuildCullMessage(guildId: string, failureCount: number): string {
  return `[cron/standup] guild ${guildId} auto-disabled after ${failureCount} consecutive Unknown Guild (10004) failures — bot is no longer in this server`;
}
