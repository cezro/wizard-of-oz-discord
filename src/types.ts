export interface StandupTarget {
  guildId: string;
  channelId: string;
  timezone: string;
}

export interface SanitizedMessage {
  id: string;
  authorId: string;
  authorMention: string;
  content: string;
  createdAt: Date;
}

export interface StandupPipelineData {
  channelId: string;
  windowStart: Date;
  windowEnd: Date;
  messages: SanitizedMessage[];
}

export type ProcessResult =
  | { kind: "empty" }
  | { kind: "summary"; markdown: string };

export interface PipelineResult {
  messageCount: number;
  posted: "empty" | "summary";
}

export interface DiscordRawMessage {
  id: string;
  type: number;
  content: string;
  timestamp: string;
  author: {
    id: string;
    bot?: boolean;
  };
}
