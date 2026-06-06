import {
  DiscordApiError,
  discordJson,
  formatUserFacingDiscordError,
} from "../utils/discord-api.js";
import { getCachedMemberIdsWithRole } from "./member-cache.js";

const PAGE_SIZE = 1000;
const PAGE_DELAY_MS = 100;

interface GuildMember {
  user: { id: string; bot?: boolean };
  roles: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchMemberIdsWithRole(
  token: string,
  guildId: string,
  roleId: string,
  excludeUserId?: string,
): Promise<string[]> {
  const cached = getCachedMemberIdsWithRole(guildId, roleId, excludeUserId);
  if (cached !== null) {
    return cached;
  }

  const memberIds: string[] = [];
  let after: string | undefined;

  while (true) {
    const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (after) query.set("after", after);

    let page: GuildMember[];
    try {
      page = await discordJson<GuildMember[]>(
        token,
        `/guilds/${guildId}/members?${query}`,
      );
    } catch (error) {
      if (error instanceof DiscordApiError && error.status === 403) {
        throw new Error(formatUserFacingDiscordError(error, "members"));
      }
      throw error;
    }

    if (page.length === 0) break;

    for (const member of page) {
      if (member.user.bot) continue;
      if (excludeUserId && member.user.id === excludeUserId) continue;
      if (member.roles.includes(roleId)) {
        memberIds.push(member.user.id);
      }
    }

    if (page.length < PAGE_SIZE) break;
    after = page[page.length - 1].user.id;
    await sleep(PAGE_DELAY_MS);
  }

  return memberIds;
}
