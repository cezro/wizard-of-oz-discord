const DISCORD_API_BASE = "https://discord.com/api/v10";
const MAX_RETRIES = 3;
const MAX_GLOBAL_RETRIES = 6;
const DISCORD_FETCH_TIMEOUT_MS = 30_000;

interface DiscordRateLimitBody {
  retry_after?: number;
  global?: boolean;
  message?: string;
}

export class DiscordApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "DiscordApiError";
  }
}

interface DiscordErrorBody {
  code?: number;
  message?: string;
  errors?: Record<string, unknown>;
}

export type DiscordErrorContext = "members" | "channel";

/** Maps common Discord API failures to actionable text for slash-command replies. */
export function formatUserFacingDiscordError(
  error: unknown,
  context: DiscordErrorContext = "members",
): string {
  if (error instanceof DiscordApiError) {
    if (error.status === 403) {
      const body = error.body as DiscordErrorBody | undefined;
      const codeSuffix =
        body?.code !== undefined ? ` (Discord code ${body.code})` : "";
      if (context === "channel") {
        return [
          `Discord denied access to the standup channel${codeSuffix}.`,
          "",
          "Check that:",
          "1. The channel in `/standup-config show` still exists",
          "2. The bot can **View Channel** and **Read Message History** there",
          "3. Re-run `/standup-config set channel:#your-standup-channel` if needed",
        ].join("\n");
      }
      return [
        `Discord denied access when listing server members${codeSuffix}.`,
        "",
        "Enable **Server Members Intent**:",
        "1. Open the [Discord Developer Portal](https://discord.com/developers/applications)",
        "2. Select this bot → **Bot** → **Privileged Gateway Intents**",
        "3. Turn on **Server Members Intent** and save",
        "4. Restart the bot (redeploy on Render or restart `npm run dev`)",
        "",
        "Then run `/standup remind-missing` again.",
      ].join("\n");
    }
    const body = error.body as DiscordErrorBody | undefined;
    if (body?.message) {
      const detail = formatDiscordValidationErrors(body.errors);
      return detail
        ? `Discord API error: ${body.message}\n${detail}`
        : `Discord API error: ${body.message}`;
    }
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function formatDiscordValidationErrors(
  errors: Record<string, unknown> | undefined,
): string | null {
  if (!errors || Object.keys(errors).length === 0) return null;
  try {
    return `\`\`\`json\n${JSON.stringify(errors, null, 2).slice(0, 1500)}\n\`\`\``;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function discordFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${DISCORD_API_BASE}${path}`;

  const isMultipart = init?.body instanceof FormData;

  for (let attempt = 0; ; attempt++) {
    const timeoutSignal = AbortSignal.timeout(DISCORD_FETCH_TIMEOUT_MS);
    const userSignal = init?.signal;
    const signal =
      userSignal != null
        ? AbortSignal.any([userSignal, timeoutSignal])
        : timeoutSignal;

    const response = await fetch(url, {
      ...init,
      signal,
      headers: {
        Authorization: `Bot ${token}`,
        ...(isMultipart ? {} : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
    });

    if (response.status === 429) {
      let retryAfterMs = 1000;
      let isGlobal = false;
      try {
        const body = (await response.clone().json()) as DiscordRateLimitBody;
        if (typeof body.retry_after === "number") {
          retryAfterMs = Math.ceil(body.retry_after * 1000);
        }
        isGlobal = body.global === true;
      } catch {
        const header = response.headers.get("retry-after");
        if (header) retryAfterMs = Math.ceil(parseFloat(header) * 1000);
      }

      const maxRetries = isGlobal ? MAX_GLOBAL_RETRIES : MAX_RETRIES;
      if (attempt < maxRetries) {
        await sleep(retryAfterMs);
        continue;
      }
    }

    return response;
  }
}

export async function discordJson<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await discordFetch(token, path, init);

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    throw new DiscordApiError(
      `Discord API error: ${response.status} ${response.statusText}`,
      response.status,
      body,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
