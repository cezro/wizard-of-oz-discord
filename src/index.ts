import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { registerSlashCommands } from "./commands/register.js";
import { loadConfig } from "./config.js";
import { startDiscordGateway } from "./discord/gateway.js";
import { verifyDiscordRequest } from "./discord/verify.js";
import { handleInteraction } from "./discord/interactions.js";
import { runAllPipelines } from "./pipeline.js";

const config = loadConfig();
const stopGateway = startDiscordGateway(config.discordBotToken);

function shutdown(): void {
  stopGateway();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const app = new Hono();

function verifyCronAuth(authHeader: string | undefined): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 && token === config.cronSecret;
}

app.get("/health", (c) => c.json({ ok: true }));

app.post("/cron/standup", async (c) => {
  if (!verifyCronAuth(c.req.header("Authorization"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const result = await runAllPipelines(config);
    return c.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/standup]", error);
    return c.json({ ok: false, error: message }, 500);
  }
});

app.post("/discord/interactions", async (c) => {
  const signature = c.req.header("X-Signature-Ed25519");
  const timestamp = c.req.header("X-Signature-Timestamp");
  const body = await c.req.text();

  if (
    !signature ||
    !timestamp ||
    !verifyDiscordRequest(
      config.discordPublicKey,
      signature,
      timestamp,
      body,
    )
  ) {
    return c.text("Invalid request signature", 401);
  }

  try {
    const interaction = JSON.parse(body) as Parameters<
      typeof handleInteraction
    >[1];
    const response = await handleInteraction(config, interaction);
    return c.json(response);
  } catch (error) {
    console.error("[discord/interactions]", error);
    return c.json({
      type: 4,
      data: {
        content: "An error occurred while handling this interaction.",
        flags: 64,
      },
    });
  }
});

registerSlashCommands(config).catch((error) => {
  console.error("[commands/register]", error);
});

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Standup summarizer listening on port ${info.port}`);
});
