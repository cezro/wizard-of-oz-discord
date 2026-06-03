import type { AppConfig } from "../config.js";
import { STANDUP_DOWNLOAD_CUSTOM_ID } from "../egress/discord.js";
import { discordJson } from "../utils/discord-api.js";
import type { DiscordInteraction } from "../discord/interaction-utils.js";
import { ephemeral, type InteractionResponse } from "../discord/interaction-utils.js";
import {
  resolveStandupMarkdownAttachment,
  type MessageWithComponents,
} from "../utils/standup-attachment.js";

const INTERACTION_MESSAGE_COMPONENT = 3;

export function isStandupDownloadInteraction(
  interaction: DiscordInteraction,
): boolean {
  return (
    interaction.type === INTERACTION_MESSAGE_COMPONENT &&
    interaction.data?.custom_id === STANDUP_DOWNLOAD_CUSTOM_ID
  );
}

export async function handleStandupDownloadInteraction(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const channelId = interaction.channel_id;
  const messageId = interaction.message?.id;
  if (!channelId || !messageId) {
    return ephemeral("Could not resolve the summary message.");
  }

  let message: MessageWithComponents = interaction.message ?? { attachments: [] };
  let attachment = resolveStandupMarkdownAttachment(message);

  if (!attachment?.url) {
    try {
      message = await discordJson<MessageWithComponents & { id: string }>(
        config.discordBotToken,
        `/channels/${channelId}/messages/${messageId}`,
      );
      attachment = resolveStandupMarkdownAttachment(message);
    } catch (error) {
      console.error("[standup-download] failed to fetch summary message:", error);
      return ephemeral("Could not load the summary file. Try again later.");
    }
  }

  if (!attachment?.url) {
    return ephemeral("No markdown file is attached to this summary.");
  }

  return ephemeral(
    `Download your summary: [${attachment.filename}](${attachment.url})`,
  );
}
