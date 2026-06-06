interface CachedMember {
  roles: string[];
  bot: boolean;
}

const guildMembers = new Map<string, Map<string, CachedMember>>();
const guildChunksReceived = new Map<string, number>();
const guildChunkTotal = new Map<string, number>();

function guildMap(guildId: string): Map<string, CachedMember> {
  let map = guildMembers.get(guildId);
  if (!map) {
    map = new Map();
    guildMembers.set(guildId, map);
  }
  return map;
}

export function clearMemberCache(): void {
  guildMembers.clear();
  guildChunksReceived.clear();
  guildChunkTotal.clear();
}

export function isGuildMemberCacheReady(guildId: string): boolean {
  const total = guildChunkTotal.get(guildId);
  const received = guildChunksReceived.get(guildId) ?? 0;
  return total !== undefined && received >= total;
}

export function ingestGuildMembersChunk(
  guildId: string,
  members: { user: { id: string; bot?: boolean }; roles: string[] }[],
  chunkIndex: number,
  chunkCount: number,
): void {
  const map = guildMap(guildId);
  for (const member of members) {
    map.set(member.user.id, {
      roles: member.roles,
      bot: member.user.bot ?? false,
    });
  }
  guildChunkTotal.set(guildId, chunkCount);
  const prev = guildChunksReceived.get(guildId) ?? 0;
  guildChunksReceived.set(guildId, Math.max(prev, chunkIndex + 1));
}

export function upsertGuildMember(
  guildId: string,
  userId: string,
  roles: string[],
  bot: boolean,
): void {
  if (!guildMembers.has(guildId)) return;
  guildMap(guildId).set(userId, { roles, bot });
}

export function removeGuildMember(guildId: string, userId: string): void {
  guildMembers.get(guildId)?.delete(userId);
}

export function getCachedMemberIdsWithRole(
  guildId: string,
  roleId: string,
  excludeUserId?: string,
): string[] | null {
  if (!isGuildMemberCacheReady(guildId)) return null;

  const map = guildMembers.get(guildId);
  if (!map) return null;

  const memberIds: string[] = [];
  for (const [userId, member] of map) {
    if (member.bot) continue;
    if (excludeUserId && userId === excludeUserId) continue;
    if (member.roles.includes(roleId)) {
      memberIds.push(userId);
    }
  }
  return memberIds;
}
