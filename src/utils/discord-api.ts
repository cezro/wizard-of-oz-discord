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
