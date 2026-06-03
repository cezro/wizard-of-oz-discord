import { getEnabledConfigs } from "./storage/config-store.js";
import type { StandupTarget } from "./types.js";

export interface AppConfig {
  discordBotToken: string;
  discordApplicationId: string;
  discordPublicKey: string;
  supabaseUrl: string;
  supabaseSecretKey: string;
  geminiApiKey: string;
  cronSecret: string;
  geminiModel: string;
  port: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value?.trim() || undefined;
}

const DISCORD_SNOWFLAKE = /^\d{17,20}$/;

function assertDiscordSnowflake(name: string, value: string): string {
  if (!DISCORD_SNOWFLAKE.test(value)) {
    throw new Error(
      `${name} must be a numeric Discord ID (17–20 digits), not a placeholder. ` +
        "Copy the value from the Discord Developer Portal (General Information).",
    );
  }
  return value;
}

function loadSupabaseSecretKey(): string {
  const secret = optionalEnv("SUPABASE_SECRET_KEY");
  if (secret) return secret;

  const legacy = optionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) {
    console.warn(
      "[config] SUPABASE_SERVICE_ROLE_KEY is deprecated; use SUPABASE_SECRET_KEY (sb_secret_...).",
    );
    return legacy;
  }

  throw new Error(
    "Missing required environment variable: SUPABASE_SECRET_KEY (or deprecated SUPABASE_SERVICE_ROLE_KEY)",
  );
}

export function loadConfig(): AppConfig {
  return {
    discordBotToken: requireEnv("DISCORD_BOT_TOKEN"),
    discordApplicationId: assertDiscordSnowflake(
      "DISCORD_APPLICATION_ID",
      requireEnv("DISCORD_APPLICATION_ID"),
    ),
    discordPublicKey: requireEnv("DISCORD_PUBLIC_KEY"),
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseSecretKey: loadSupabaseSecretKey(),
    geminiApiKey: requireEnv("GEMINI_API_KEY"),
    cronSecret: requireEnv("CRON_SECRET"),
    geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite",
    port: parseInt(process.env.PORT ?? "3000", 10),
  };
}

const NO_CONFIG_MESSAGE =
  "No standup channel configured. Run /standup-config in your Discord server.";

export async function resolveStandupTargets(
  config: AppConfig,
): Promise<StandupTarget[]> {
  const targets = await getEnabledConfigs(config);
  if (targets.length === 0) {
    throw new Error(NO_CONFIG_MESSAGE);
  }
  return targets;
}
