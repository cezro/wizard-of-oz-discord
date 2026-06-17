import {
  assertDiscordAvailable,
  CLOUDFLARE_1015_MESSAGE,
  isCloudflareHtmlBody,
  isDiscordCircuitOpen,
  recordCloudflare1015,
} from "./discord-circuit.js";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const INTERACTION_FETCH_TIMEOUT_MS = 15_000;
const MAX_INTERACTION_RETRIES = 3;
const MAX_INTERACTION_WALL_CLOCK_MS = 45_000;
const EPHEMERAL_FLAG = 64;

const RETRY_POLL_MS = 15_000;
const RETRY_DELAY_MS = 60_000;
const MAX_PENDING_ATTEMPTS = 8;
const INTERACTION_TOKEN_TTL_MS = 14 * 60 * 1000;

export class InteractionFollowupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InteractionFollowupError";
  }
}

interface PendingCompletion {
  applicationId: string;
  interactionToken: string;
  content: string;
  ephemeral: boolean;
  createdAt: number;
  nextRetryAt: number;
  attempt: number;
}

const pendingCompletions: PendingCompletion[] = [];
let retryWorkerRunning = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateLog(text: string, max = 300): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

async function readResponseSnippet(response: Response): Promise<string> {
  const text = await response.text();
  return truncateLog(text);
}

function is1015Error(error: unknown): boolean {
  if (error instanceof InteractionFollowupError) {
    return error.message.includes("Cloudflare 1015");
  }
  return false;
}

async function interactionWebhookFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  assertDiscordAvailable();

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
      recordCloudflare1015();
      throw new InteractionFollowupError(CLOUDFLARE_1015_MESSAGE);
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

function scheduleCompletionRetry(
  applicationId: string,
  interactionToken: string,
  content: string,
  ephemeral: boolean,
): void {
  const existing = pendingCompletions.find(
    (item) => item.interactionToken === interactionToken,
  );
  if (existing) {
    existing.content = content;
    existing.ephemeral = ephemeral;
    return;
  }

  pendingCompletions.push({
    applicationId,
    interactionToken,
    content,
    ephemeral,
    createdAt: Date.now(),
    nextRetryAt: Date.now() + RETRY_DELAY_MS,
    attempt: 0,
  });

  console.warn(
    "[discord/interaction-followup] queued delayed completion (circuit open or follow-up failed)",
  );
  ensureRetryWorker();
}

function ensureRetryWorker(): void {
  if (retryWorkerRunning) return;
  retryWorkerRunning = true;
  void runRetryWorker();
}

async function tryCompleteOnce(item: PendingCompletion): Promise<boolean> {
  const url = `${DISCORD_API_BASE}/webhooks/${item.applicationId}/${item.interactionToken}/messages/@original`;

  try {
    const response = await interactionWebhookFetch(url, {
      method: "PATCH",
      body: JSON.stringify({ content: item.content.slice(0, 2000) }),
    });
    if (response.ok) return true;
  } catch (error) {
    if (is1015Error(error)) return false;
  }

  if (isDiscordCircuitOpen()) return false;

  const postUrl = `${DISCORD_API_BASE}/webhooks/${item.applicationId}/${item.interactionToken}/messages`;
  const body: { content: string; flags?: number } = {
    content: item.content.slice(0, 2000),
  };
  if (item.ephemeral) body.flags = EPHEMERAL_FLAG;

  try {
    const response = await interactionWebhookFetch(postUrl, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function runRetryWorker(): Promise<void> {
  while (pendingCompletions.length > 0) {
    await sleep(RETRY_POLL_MS);
    const now = Date.now();
    const remaining: PendingCompletion[] = [];

    for (const item of pendingCompletions) {
      if (now - item.createdAt > INTERACTION_TOKEN_TTL_MS) {
        console.error(
          "[discord/interaction-followup] gave up delayed completion — interaction token expired",
        );
        continue;
      }

      if (isDiscordCircuitOpen() || now < item.nextRetryAt) {
        remaining.push(item);
        continue;
      }

      const ok = await tryCompleteOnce(item);
      if (ok) {
        console.log(
          "[discord/interaction-followup] completed via delayed retry",
        );
        continue;
      }

      item.attempt++;
      if (item.attempt >= MAX_PENDING_ATTEMPTS) {
        console.error(
          "[discord/interaction-followup] gave up delayed completion after max retries",
        );
        continue;
      }

      item.nextRetryAt = now + RETRY_DELAY_MS;
      remaining.push(item);
    }

    pendingCompletions.length = 0;
    pendingCompletions.push(...remaining);
  }

  retryWorkerRunning = false;
}

export async function editDeferredInteraction(
  applicationId: string,
  interactionToken: string,
  content: string,
): Promise<boolean> {
  if (isDiscordCircuitOpen()) {
    return false;
  }

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
  if (isDiscordCircuitOpen()) {
    return false;
  }

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

  if (isDiscordCircuitOpen()) {
    scheduleCompletionRetry(
      applicationId,
      interactionToken,
      content,
      ephemeral,
    );
    return;
  }

  const edited = await editDeferredInteraction(
    applicationId,
    interactionToken,
    content,
  );
  if (edited) {
    console.log("[discord/interaction-followup] completed via PATCH @original");
    return;
  }

  if (isDiscordCircuitOpen()) {
    scheduleCompletionRetry(
      applicationId,
      interactionToken,
      content,
      ephemeral,
    );
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

  scheduleCompletionRetry(applicationId, interactionToken, content, ephemeral);
  console.error(
    "[discord/interaction-followup] failed to complete deferred interaction (PATCH and POST both failed); retry scheduled",
  );
}
