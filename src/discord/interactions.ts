import {
  handleConfigUiInteraction,
  handleStandupConfigCommand,
  isConfigUiInteraction,
} from "../commands/standup-config.js";
import {
  handleStandupDownloadInteraction,
  isStandupDownloadInteraction,
} from "../commands/standup-download.js";
import { handleStandupCommand } from "../commands/standup.js";
import type { AppConfig } from "../config.js";
import type { DiscordInteraction } from "../discord/interaction-utils.js";

const INTERACTION_PING = 1;
const INTERACTION_APPLICATION_COMMAND = 2;
const INTERACTION_MESSAGE_COMPONENT = 3;
const INTERACTION_MODAL_SUBMIT = 5;

const RESPONSE_PONG = 1;

export async function handleInteraction(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<Record<string, unknown>> {
  if (interaction.type === INTERACTION_PING) {
    return { type: RESPONSE_PONG };
  }

  if (interaction.type === INTERACTION_MODAL_SUBMIT) {
    if (isConfigUiInteraction(interaction)) {
      return handleConfigUiInteraction(config, interaction);
    }
    return {
      type: 4,
      data: { content: "Unsupported modal.", flags: 64 },
    };
  }

  if (interaction.type === INTERACTION_MESSAGE_COMPONENT) {
    if (isConfigUiInteraction(interaction)) {
      return handleConfigUiInteraction(config, interaction);
    }
    if (isStandupDownloadInteraction(interaction)) {
      return handleStandupDownloadInteraction(config, interaction);
    }
    return {
      type: 4,
      data: { content: "Unsupported button.", flags: 64 },
    };
  }

  if (interaction.type === INTERACTION_APPLICATION_COMMAND) {
    const commandName = interaction.data?.name;
    if (commandName === "standup-config") {
      return handleStandupConfigCommand(config, interaction);
    }
    if (commandName === "standup") {
      return handleStandupCommand(config, interaction);
    }
    return {
      type: 4,
      data: { content: "Unknown command.", flags: 64 },
    };
  }

  return {
    type: 4,
    data: { content: "Unsupported interaction type.", flags: 64 },
  };
}
