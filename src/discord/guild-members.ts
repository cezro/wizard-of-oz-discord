import {
  DiscordApiError,
  discordJson,
  formatUserFacingDiscordError,
} from "../utils/discord-api.js";
import { withTimeout } from "../utils/with-timeout.js";
import {
  getCachedMemberIdsWithRole,
  isGuildMemberCacheReady,
} from "./member-cache.js";

const PAGE_SIZE = 1000;
const PAGE_DELAY_MS = 100;
const MEMBER_FETCH_TIMEOUT_MS = 45_000;
const MAX_MEMBER_PAGES = 20;

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
    console.log(`[guild-members] cache hit guild=${guildId} role=${roleId}`);
    return cached;
  }

  console.log(
    `[guild-members] cache miss guild=${guildId} role=${roleId}, REST paginate`,
  );

  return withTimeout(
    fetchMemberIdsWithRolePaginated(token, guildId, roleId, excludeUserId),
    MEMBER_FETCH_TIMEOUT_MS,
    `Timed out listing guild members after ${MEMBER_FETCH_TIMEOUT_MS / 1000}s — gateway cache may still be loading`,
  );
}

async function fetchMemberIdsWithRolePaginated(
  token: string,
  guildId: string,
  roleId: string,
  excludeUserId?: string,
): Promise<string[]> {
  const memberIds: string[] = [];
  let after: string | undefined;
  let pages = 0;

  while (pages < MAX_MEMBER_PAGES) {
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

    pages++;

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

  if (pages >= MAX_MEMBER_PAGES) {
    console.warn(
      `[guild-members] hit max pages (${MAX_MEMBER_PAGES}) guild=${guildId}`,
    );
  }

  return memberIds;
}

export { isGuildMemberCacheReady };
