import type { DiscordInteraction } from "./interaction-utils.js";

const MANAGE_GUILD = 1n << 5n;

export function hasManageGuild(interaction: DiscordInteraction): boolean {
  const perms = interaction.member?.permissions;
  if (!perms) return false;
  return (BigInt(perms) & MANAGE_GUILD) === MANAGE_GUILD;
}

export function requireManageGuild(interaction: DiscordInteraction): boolean {
  return hasManageGuild(interaction);
}
