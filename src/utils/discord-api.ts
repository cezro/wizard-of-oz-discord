const DISCORD_API_BASE = "https://discord.com/api/v10";
const MAX_RETRIES = 3;

interface DiscordRateLimitBody {
  retry_after?: number;
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

/** Maps common Discord API failures to actionable text for slash-command replies. */
export function formatUserFacingDiscordError(error: unknown): string {
  if (error instanceof DiscordApiError) {
    if (error.status === 403) {
      const body = error.body as DiscordErrorBody | undefined;
      const codeSuffix =
        body?.code !== undefined ? ` (Discord code ${body.code})` : "";
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

function formatDiscordValidationErrors(
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

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      let retryAfterMs = 1000;
      try {
        const body = (await response.clone().json()) as DiscordRateLimitBody;
        if (typeof body.retry_after === "number") {
          retryAfterMs = Math.ceil(body.retry_after * 1000);
        }
      } catch {
        const header = response.headers.get("retry-after");
        if (header) retryAfterMs = Math.ceil(parseFloat(header) * 1000);
      }
      await sleep(retryAfterMs);
      continue;
    }

    return response;
  }

  throw new DiscordApiError("Discord API rate limit exceeded after retries", 429);
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
