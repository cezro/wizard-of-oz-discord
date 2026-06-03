import type { MessageWithComponents } from "../utils/standup-attachment.js";

interface InteractionOption {
  type: number;
  name: string;
  value?: string | number;
  options?: InteractionOption[];
}

interface ModalTextInputComponent {
  type: number;
  custom_id: string;
  value?: string;
}

interface ModalActionRow {
  type: number;
  components: ModalTextInputComponent[];
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
    values?: string[];
    options?: InteractionOption[];
    components?: ModalActionRow[];
  };
  message?: MessageWithComponents & { id: string };
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

export interface InteractionMessageData {
  content?: string;
  embeds?: Record<string, unknown>[];
  components?: unknown[];
}

export function getInteractionCustomId(
  interaction: DiscordInteraction,
): string | undefined {
  return interaction.data?.custom_id;
}

export function ephemeralMessageWithComponents(
  data: InteractionMessageData,
): InteractionResponse {
  return {
    type: RESPONSE_MESSAGE,
    data: { ...data, flags: EPHEMERAL },
  };
}

/** Updates the message that contained the clicked component (ephemeral-safe). */
export function updateMessage(data: InteractionMessageData): InteractionResponse {
  return {
    type: 7,
    data,
  };
}

export function openModal(modal: Record<string, unknown>): InteractionResponse {
  return {
    type: 9,
    data: modal,
  };
}

export function getSelectValues(interaction: DiscordInteraction): string[] {
  return interaction.data?.values ?? [];
}

export function getModalTextValue(
  interaction: DiscordInteraction,
  fieldCustomId: string,
): string | undefined {
  for (const row of interaction.data?.components ?? []) {
    for (const component of row.components) {
      if (component.custom_id === fieldCustomId) {
        return component.value;
      }
    }
  }
  return undefined;
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
