/** Pause outbound Discord HTTP after Cloudflare IP ban (error 1015). */
const CIRCUIT_COOLDOWN_MS = 10 * 60 * 1000;

export const CLOUDFLARE_1015_MESSAGE =
  "Discord is rate-limiting this server IP (Cloudflare 1015). Try again in a few minutes.";

let circuitOpenUntil = 0;

export class DiscordCircuitOpenError extends Error {
  constructor(message = CLOUDFLARE_1015_MESSAGE) {
    super(message);
    this.name = "DiscordCircuitOpenError";
  }
}

export function isCloudflareHtmlBody(text: string): boolean {
  const lower = text.trimStart().toLowerCase();
  return lower.startsWith("<!doctype") || lower.includes("error 1015");
}

export function isCloudflareRateLimitResponse(
  status: number,
  bodyText: string,
  contentType: string | null,
): boolean {
  if (status !== 429) return false;
  if (contentType?.includes("text/html")) return true;
  return isCloudflareHtmlBody(bodyText);
}

export function isDiscordCircuitOpen(): boolean {
  return Date.now() < circuitOpenUntil;
}

export function recordCloudflare1015(): void {
  const until = Date.now() + CIRCUIT_COOLDOWN_MS;
  if (until > circuitOpenUntil) {
    circuitOpenUntil = until;
    console.warn(
      `[discord/circuit] Cloudflare 1015 — pausing outbound Discord HTTP until ${new Date(circuitOpenUntil).toISOString()}`,
    );
  }
}

export function assertDiscordAvailable(): void {
  if (isDiscordCircuitOpen()) {
    throw new DiscordCircuitOpenError();
  }
}
