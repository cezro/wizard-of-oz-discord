import type { AppConfig } from "../config.js";
import type { ProcessResult, StandupTarget } from "../types.js";
import {
  DiscordApiError,
  discordJson,
  formatDiscordValidationErrors,
} from "../utils/discord-api.js";
import { markdownForFileExport } from "../utils/markdown-export.js";
import {
  resolveStandupMarkdownAttachment,
  type MessageWithComponents,
} from "../utils/standup-attachment.js";
import {
  formatDateInTimezone,
  getLocalTimeParts,
} from "../utils/timezone.js";

const EMBED_COLOR = 0x5865f2;
const SUMMARY_TEXT_LIMIT = 4096;
const IS_COMPONENTS_V2 = 1 << 15;
const EMPTY_DAY_MESSAGE =
  "No standup updates recorded for today! Hope everyone had a productive day.";
const REMINDER_MESSAGE =
  "**Daily Standup Reminder** — Please post your async DSM update in this channel.";
const MISSING_NUDGE_PREFIX =
  "**End of Day DSM Reminder** — Please post your async DSM update. Still waiting on: ";
const DISCORD_CONTENT_LIMIT = 2000;

const COMPONENT_TYPE_ACTION_ROW = 1;
const COMPONENT_TYPE_BUTTON = 2;
const COMPONENT_TYPE_TEXT_DISPLAY = 10;
const COMPONENT_TYPE_FILE = 13;
const COMPONENT_TYPE_CONTAINER = 17;
const BUTTON_STYLE_PRIMARY = 1;
const BUTTON_STYLE_LINK = 5;
export const STANDUP_DOWNLOAD_CUSTOM_ID = "standup:md_download";

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  footer?: { text: string };
}

interface AllowedMentions {
  parse?: ("users" | "roles" | "everyone")[];
  users?: string[];
  roles?: string[];
}

interface ChannelMessageBody {
  content?: string;
  embeds?: DiscordEmbed[];
  allowed_mentions?: AllowedMentions;
}

interface MessageAttachment {
  filename: string;
  content: string;
}

interface DiscordMessageComponent {
  type: number;
  id?: number;
  accent_color?: number;
  components?: DiscordMessageComponent[];
  content?: string;
  style?: number;
  label?: string;
  url?: string;
  custom_id?: string;
  file?: { url: string };
  spoiler?: boolean;
}

interface ComponentsV2MessageBody {
  flags: number;
  components: DiscordMessageComponent[];
  attachments?: { id: number; filename: string }[];
  allowed_mentions?: AllowedMentions;
}

interface PatchMessageBody {
  flags: number;
  components: DiscordMessageComponent[];
}

interface DiscordCreatedMessage {
  id: string;
  attachments: { id: string; url: string; filename: string }[];
}

const MAX_ALLOWED_USER_MENTIONS = 100;

export async function broadcastReminder(
  config: AppConfig,
  channelId: string,
  reporterUserIds: string[] = [],
): Promise<void> {
  if (reporterUserIds.length === 0) {
    await postChannelMessage(config, channelId, {
      content: REMINDER_MESSAGE,
    });
    return;
  }

  const chunks = chunkMentionMessages(reporterUserIds, (isFirstChunk) =>
    isFirstChunk ? `${REMINDER_MESSAGE}\n\n` : null,
  );
  for (const chunk of chunks) {
    await postChannelMessage(config, channelId, {
      content: chunk.content,
      allowed_mentions: {
        parse: [],
        users: chunk.userIds,
      },
    });
  }
}

/** Pings everyone with the reporter role in one message (no member list fetch). */
export async function broadcastReminderWithRole(
  config: AppConfig,
  channelId: string,
  roleId: string,
): Promise<void> {
  await postChannelMessage(config, channelId, {
    content: `${REMINDER_MESSAGE}\n\n<@&${roleId}>`,
    allowed_mentions: {
      parse: [],
      roles: [roleId],
    },
  });
}

export async function broadcastMissingReporterNudge(
  config: AppConfig,
  channelId: string,
  missingUserIds: string[],
): Promise<void> {
  const chunks = chunkMentionMessages(missingUserIds, () => MISSING_NUDGE_PREFIX);
  for (const chunk of chunks) {
    await postChannelMessage(config, channelId, {
      content: chunk.content,
      allowed_mentions: {
        parse: [],
        users: chunk.userIds,
      },
    });
  }
}

function chunkMentionMessages(
  userIds: string[],
  getPrefix: (isFirstChunk: boolean) => string | null,
): { content: string; userIds: string[] }[] {
  const messages: { content: string; userIds: string[] }[] = [];
  let currentIds: string[] = [];
  let isFirstChunk = true;

  for (const id of userIds) {
    const candidateIds = [...currentIds, id];
    const content = buildMentionChunkContent(getPrefix(isFirstChunk), candidateIds);
    const overCharLimit =
      content.length > DISCORD_CONTENT_LIMIT && currentIds.length > 0;
    const overMentionLimit =
      candidateIds.length > MAX_ALLOWED_USER_MENTIONS && currentIds.length > 0;

    if (overCharLimit || overMentionLimit) {
      messages.push({
        content: buildMentionChunkContent(getPrefix(isFirstChunk), currentIds),
        userIds: [...currentIds],
      });
      isFirstChunk = false;
      currentIds = [id];
    } else {
      currentIds = candidateIds;
    }
  }

  if (currentIds.length > 0) {
    messages.push({
      content: buildMentionChunkContent(getPrefix(isFirstChunk), currentIds),
      userIds: [...currentIds],
    });
  }

  return messages;
}

function buildMentionChunkContent(
  prefix: string | null,
  userIds: string[],
): string {
  const mentions = userIds.map((id) => `<@${id}>`).join(" ");
  if (prefix === null) return mentions;
  return prefix + mentions;
}

export async function broadcastResult(
  config: AppConfig,
  target: StandupTarget,
  result: ProcessResult,
  opts?: { titleDate?: Date; authorDisplayNames?: Map<string, string> },
): Promise<"empty" | "summary"> {
  if (result.kind === "empty") {
    await postChannelMessage(config, target.channelId, {
      content: EMPTY_DAY_MESSAGE,
    });
    return "empty";
  }

  const titleDate = opts?.titleDate ?? new Date();
  const dateString = getLocalTimeParts(target.timezone, titleDate).dateString;
  const formattedDate = formatDateInTimezone(target.timezone, titleDate);
  const { description, truncated } = truncateSummaryText(result.markdown);
  const filename = `standup-summary-${dateString}.md`;
  const exportMarkdown = markdownForFileExport(
    result.markdown,
    opts?.authorDisplayNames ?? new Map(),
  );

  const containerChildren: DiscordMessageComponent[] = [
    {
      type: COMPONENT_TYPE_TEXT_DISPLAY,
      content: `# 📊 Daily Standup Summary - ${formattedDate}\n\n${description}`,
    },
  ];

  if (truncated) {
    containerChildren.push({
      type: COMPONENT_TYPE_TEXT_DISPLAY,
      content:
        "-# Full summary available via Download Markdown below.",
    });
  }

  const created = await postComponentsV2Message(
    config,
    target.channelId,
    {
      flags: IS_COMPONENTS_V2,
      attachments: [{ id: 0, filename }],
      components: buildSummaryComponents(containerChildren, filename, {
        custom_id: STANDUP_DOWNLOAD_CUSTOM_ID,
      }),
    },
    { filename, content: exportMarkdown },
  );

  const attachmentUrl = await resolveSummaryAttachmentUrl(
    config,
    target.channelId,
    created.id,
  );

  if (attachmentUrl) {
    try {
      await patchChannelMessage(config, target.channelId, created.id, {
        flags: IS_COMPONENTS_V2,
        components: buildSummaryComponents(containerChildren, filename, {
          url: attachmentUrl,
        }),
      });
    } catch (error) {
      logPatchFailure(error);
    }
  }

  return "summary";
}

function logPatchFailure(error: unknown): void {
  if (error instanceof DiscordApiError) {
    const body = error.body as { errors?: Record<string, unknown> } | undefined;
    const detail = formatDiscordValidationErrors(body?.errors);
    console.error(
      "[egress/discord] Failed to upgrade download button to link; interaction fallback remains:",
      error.message,
      detail ?? "",
    );
    return;
  }
  console.error(
    "[egress/discord] Failed to upgrade download button to link; interaction fallback remains:",
    error,
  );
}

const ATTACHMENT_URL_RETRIES = 2;
const ATTACHMENT_URL_RETRY_MS = 500;

async function resolveSummaryAttachmentUrl(
  config: AppConfig,
  channelId: string,
  messageId: string,
): Promise<string | undefined> {
  for (let attempt = 0; attempt <= ATTACHMENT_URL_RETRIES; attempt++) {
    const message = await discordJson<MessageWithComponents & { id: string }>(
      config.discordBotToken,
      `/channels/${channelId}/messages/${messageId}`,
    );
    const attachment = resolveStandupMarkdownAttachment(message);
    if (attachment?.url) return attachment.url;

    if (attempt < ATTACHMENT_URL_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, ATTACHMENT_URL_RETRY_MS));
    }
  }
  return undefined;
}

function buildSummaryComponents(
  containerChildren: DiscordMessageComponent[],
  filename: string,
  downloadButton: { url: string } | { custom_id: string } | null,
): DiscordMessageComponent[] {
  const components: DiscordMessageComponent[] = [
    {
      type: COMPONENT_TYPE_CONTAINER,
      accent_color: EMBED_COLOR,
      components: containerChildren,
    },
    {
      type: COMPONENT_TYPE_FILE,
      file: { url: `attachment://${filename}` },
      spoiler: true,
    },
  ];

  if (downloadButton) {
    components.push(
      buildDownloadActionRow(
        "url" in downloadButton ? BUTTON_STYLE_LINK : BUTTON_STYLE_PRIMARY,
        downloadButton,
      ),
    );
  }

  return components;
}

function buildDownloadActionRow(
  style: number,
  button: { url: string } | { custom_id: string },
): DiscordMessageComponent {
  return {
    type: COMPONENT_TYPE_ACTION_ROW,
    components: [
      {
        type: COMPONENT_TYPE_BUTTON,
        style,
        label: "Download Markdown",
        ...button,
      },
    ],
  };
}

function truncateSummaryText(markdown: string): {
  description: string;
  truncated: boolean;
} {
  if (markdown.length <= SUMMARY_TEXT_LIMIT) {
    return { description: markdown, truncated: false };
  }

  const suffix = "\n\n… _(truncated)_";
  const maxLen = SUMMARY_TEXT_LIMIT - suffix.length;
  return {
    description: markdown.slice(0, maxLen) + suffix,
    truncated: true,
  };
}

async function postChannelMessage(
  config: AppConfig,
  channelId: string,
  body: ChannelMessageBody,
): Promise<void> {
  await discordJson(config.discordBotToken, `/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function postComponentsV2Message(
  config: AppConfig,
  channelId: string,
  body: ComponentsV2MessageBody,
  attachment: MessageAttachment,
): Promise<DiscordCreatedMessage> {
  const form = new FormData();
  form.append("payload_json", JSON.stringify(body));
  form.append(
    "files[0]",
    new Blob([attachment.content], { type: "text/markdown; charset=utf-8" }),
    attachment.filename,
  );

  return discordJson<DiscordCreatedMessage>(
    config.discordBotToken,
    `/channels/${channelId}/messages`,
    {
      method: "POST",
      body: form,
    },
  );
}

async function patchChannelMessage(
  config: AppConfig,
  channelId: string,
  messageId: string,
  body: PatchMessageBody,
): Promise<void> {
  await discordJson(
    config.discordBotToken,
    `/channels/${channelId}/messages/${messageId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}
