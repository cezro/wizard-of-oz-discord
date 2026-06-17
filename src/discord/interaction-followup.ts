const DISCORD_API_BASE = "https://discord.com/api/v10";
const INTERACTION_FETCH_TIMEOUT_MS = 15_000;
const MAX_INTERACTION_RETRIES = 3;
const MAX_INTERACTION_WALL_CLOCK_MS = 45_000;
const EPHEMERAL_FLAG = 64;

export class InteractionFollowupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InteractionFollowupError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateLog(text: string, max = 300): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

function isCloudflareHtmlBody(text: string): boolean {
  const lower = text.trimStart().toLowerCase();
  return lower.startsWith("<!doctype") || lower.includes("error 1015");
}

async function readResponseSnippet(response: Response): Promise<string> {
  const text = await response.text();
  return truncateLog(text);
}

async function interactionWebhookFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const startedAt = Date.now();

  for (let attempt = 0; ; attempt++) {
    const elapsed = Date.now() - startedAt;
    if (elapsed >= MAX_INTERACTION_WALL_CLOCK_MS) {
      throw new InteractionFollowupError(
        "Discord interaction follow-up timed out (rate limits). Try again in a few minutes.",
      );
    }

    const timeoutSignal = AbortSignal.timeout(INTERACTION_FETCH_TIMEOUT_MS);
    const userSignal = init?.signal;
    const signal =
      userSignal != null
        ? AbortSignal.any([userSignal, timeoutSignal])
        : timeoutSignal;

    const response = await fetch(url, {
      ...init,
      signal,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (response.status !== 429) {
      return response;
    }

    const bodyText = await response.clone().text();
    if (isCloudflareHtmlBody(bodyText)) {
      throw new InteractionFollowupError(
        "Discord is rate-limiting this server IP (Cloudflare 1015). Try again in a few minutes.",
      );
    }

    let retryAfterMs = 1000;
    try {
      const body = JSON.parse(bodyText) as { retry_after?: number };
      if (typeof body.retry_after === "number") {
        retryAfterMs = Math.ceil(body.retry_after * 1000);
      }
    } catch {
      const header = response.headers.get("retry-after");
      if (header) retryAfterMs = Math.ceil(parseFloat(header) * 1000);
    }

    if (attempt >= MAX_INTERACTION_RETRIES - 1) {
      return response;
    }

    const remaining = MAX_INTERACTION_WALL_CLOCK_MS - (Date.now() - startedAt);
    const waitMs = Math.min(retryAfterMs, remaining);
    if (waitMs <= 0) {
      return response;
    }

    await sleep(waitMs);
  }
}

export async function editDeferredInteraction(
  applicationId: string,
  interactionToken: string,
  content: string,
): Promise<boolean> {
  const url = `${DISCORD_API_BASE}/webhooks/${applicationId}/${interactionToken}/messages/@original`;

  try {
    const response = await interactionWebhookFetch(url, {
      method: "PATCH",
      body: JSON.stringify({ content: content.slice(0, 2000) }),
    });

    if (!response.ok) {
      const snippet = await readResponseSnippet(response);
      console.error(
        "[discord/interaction-followup] edit failed:",
        response.status,
        snippet,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      "[discord/interaction-followup] edit error:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

export async function sendFollowUp(
  applicationId: string,
  interactionToken: string,
  content: string,
  options: { ephemeral?: boolean } = {},
): Promise<boolean> {
  const url = `${DISCORD_API_BASE}/webhooks/${applicationId}/${interactionToken}/messages`;
  const body: { content: string; flags?: number } = {
    content: content.slice(0, 2000),
  };
  if (options.ephemeral) {
    body.flags = EPHEMERAL_FLAG;
  }

  try {
    const response = await interactionWebhookFetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const snippet = await readResponseSnippet(response);
      console.error(
        "[discord/interaction-followup] follow-up POST failed:",
        response.status,
        snippet,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      "[discord/interaction-followup] follow-up POST error:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

export async function completeDeferredInteraction(
  applicationId: string,
  interactionToken: string,
  content: string,
  options: { ephemeral?: boolean } = { ephemeral: true },
): Promise<void> {
  const ephemeral = options.ephemeral ?? true;

  const edited = await editDeferredInteraction(
    applicationId,
    interactionToken,
    content,
  );
  if (edited) {
    console.log("[discord/interaction-followup] completed via PATCH @original");
    return;
  }

  const posted = await sendFollowUp(applicationId, interactionToken, content, {
    ephemeral,
  });
  if (posted) {
    console.log(
      `[discord/interaction-followup] completed via POST follow-up (ephemeral=${ephemeral})`,
    );
    return;
  }

  console.error(
    "[discord/interaction-followup] failed to complete deferred interaction (PATCH and POST both failed)",
  );
}
