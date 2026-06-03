import { handleStandupConfigCommand } from "../commands/standup-config.js";
import { handleStandupCommand } from "../commands/standup.js";
import type { AppConfig } from "../config.js";
import type { DiscordInteraction } from "../discord/interaction-utils.js";

const INTERACTION_PING = 1;
const INTERACTION_APPLICATION_COMMAND = 2;

const RESPONSE_PONG = 1;

export async function handleInteraction(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<Record<string, unknown>> {
  if (interaction.type === INTERACTION_PING) {
    return { type: RESPONSE_PONG };
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
