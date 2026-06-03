interface InteractionOption {
  type: number;
  name: string;
  value?: string | number;
  options?: InteractionOption[];
}

export interface DiscordInteraction {
  type: number;
  token?: string;
  application_id?: string;
  channel_id?: string;
  data?: {
    name?: string;
    custom_id?: string;
    component_type?: number;
    options?: InteractionOption[];
  };
  message?: {
    id: string;
    attachments?: { id: string; url: string; filename: string }[];
  };
  guild_id?: string;
  member?: {
    user: { id: string };
    permissions?: string;
  };
  user?: { id: string };
}

type InteractionResponse = Record<string, unknown>;

const EPHEMERAL = 64;
const RESPONSE_MESSAGE = 4;
const RESPONSE_DEFERRED_MESSAGE = 5;

export function ephemeral(content: string): InteractionResponse {
  return {
    type: RESPONSE_MESSAGE,
    data: { content, flags: EPHEMERAL },
  };
}

/** Acknowledge immediately; follow up via interaction webhook (15 min window). */
export function deferredEphemeral(): InteractionResponse {
  return {
    type: RESPONSE_DEFERRED_MESSAGE,
    data: { flags: EPHEMERAL },
  };
}

export function getUserId(interaction: DiscordInteraction): string {
  return interaction.member?.user.id ?? interaction.user?.id ?? "unknown";
}

export function getSubcommand(interaction: DiscordInteraction): string | undefined {
  return interaction.data?.options?.[0]?.name;
}

export function getSubcommandOption(
  interaction: DiscordInteraction,
  optionName: string,
): string | undefined {
  const sub = interaction.data?.options?.[0];
  const opt = sub?.options?.find((o) => o.name === optionName);
  if (opt?.value === undefined) return undefined;
  return String(opt.value);
}

export function getSubcommandIntegerOption(
  interaction: DiscordInteraction,
  optionName: string,
): number | undefined {
  const sub = interaction.data?.options?.[0];
  const opt = sub?.options?.find((o) => o.name === optionName);
  if (opt?.value === undefined) return undefined;
  return Number(opt.value);
}

type GuildContext =
  | { ok: true; guildId: string }
  | { ok: false; response: InteractionResponse };

export function requireGuild(interaction: DiscordInteraction): GuildContext {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return {
      ok: false,
      response: ephemeral("This command can only be used in a server."),
    };
  }
  return { ok: true, guildId };
}

export type { InteractionResponse };
