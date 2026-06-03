const DISCORD_API_BASE = "https://discord.com/api/v10";

export async function editDeferredInteraction(
  applicationId: string,
  interactionToken: string,
  content: string,
): Promise<void> {
  const url = `${DISCORD_API_BASE}/webhooks/${applicationId}/${interactionToken}/messages/@original`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    console.error(
      "[discord/interaction-followup] edit failed:",
      response.status,
      body,
    );
  }
}
