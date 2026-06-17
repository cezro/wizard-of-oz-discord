const DISCORD_API_BASE = "https://discord.com/api/v10";

export async function editDeferredInteraction(
  applicationId: string,
  interactionToken: string,
  content: string,
): Promise<void> {
  const url = `${DISCORD_API_BASE}/webhooks/${applicationId}/${interactionToken}/messages/@original`;

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 2000) }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      let body: unknown = bodyText;
      try {
        body = JSON.parse(bodyText);
      } catch {
        // keep raw text
      }
      console.error(
        "[discord/interaction-followup] edit failed:",
        response.status,
        body,
      );
    }
  } catch (error) {
    console.error("[discord/interaction-followup] edit error:", error);
  }
}
