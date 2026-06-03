export const COMPONENT_TYPE_FILE = 13;

export interface MessageAttachmentRef {
  id: string;
  url: string;
  filename: string;
}

interface UnfurledMediaItem {
  url?: string;
  attachment_id?: string;
}

export interface MessageComponentNode {
  type: number;
  components?: MessageComponentNode[];
  file?: UnfurledMediaItem;
}

export interface MessageWithComponents {
  attachments?: MessageAttachmentRef[];
  components?: MessageComponentNode[];
}

export function resolveStandupMarkdownAttachment(
  message: MessageWithComponents,
): MessageAttachmentRef | undefined {
  const fromArray = message.attachments?.find((a) => a.url);
  if (fromArray?.url) return fromArray;

  return findFileAttachmentInComponents(
    message.components ?? [],
    message.attachments ?? [],
  );
}

function findFileAttachmentInComponents(
  components: MessageComponentNode[],
  attachments: MessageAttachmentRef[],
): MessageAttachmentRef | undefined {
  for (const component of components) {
    if (component.type === COMPONENT_TYPE_FILE && component.file) {
      const { url, attachment_id } = component.file;
      if (url?.startsWith("https://")) {
        const match = attachments.find((a) => a.url === url);
        return {
          id: match?.id ?? attachment_id ?? "",
          url,
          filename:
            match?.filename ??
            url.split("/").pop()?.split("?")[0] ??
            "standup-summary.md",
        };
      }
      if (attachment_id) {
        const match = attachments.find((a) => a.id === attachment_id);
        if (match?.url) return match;
      }
    }
    if (component.components?.length) {
      const nested = findFileAttachmentInComponents(
        component.components,
        attachments,
      );
      if (nested) return nested;
    }
  }
  return undefined;
}
