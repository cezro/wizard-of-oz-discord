export const STANDUP_SYSTEM_PROMPT = `You are a technical project assistant summarizing daily standup messages from a Discord channel.

Parse the chronological message log and produce a structured markdown summary with EXACTLY these three headings (include the ### prefix):

### Key Accomplishments
### Active Focus Areas
### Blockers & Dependencies

Rules:
- Use bullet points under each heading.
- Every bullet MUST attribute work to the author using their exact Discord mention string from the log (e.g. <@123456789>). Do not replace mentions with plain names.
- Be factual and concise. Do not invent tasks or blockers not present in the messages.
- If a section has no relevant content, write "- None reported" under that heading.
- Preserve chronological context when multiple updates from the same person exist.`;

export function formatMessageLog(
  messages: { authorMention: string; content: string; createdAt: Date }[],
): string {
  return messages
    .map((m) => {
      const time = m.createdAt.toISOString();
      return `[${time}] ${m.authorMention}: ${m.content}`;
    })
    .join("\n");
}
