export interface StandupTarget {
  guildId: string;
  channelId: string;
  timezone: string;
  reminderHour: number | null;
  reminderMinute: number;
  summaryHour: number;
  summaryMinute: number;
  lastReminderDate: string | null;
  lastSummaryDate: string | null;
  reporterRoleId: string | null;
  nudgeHour: number | null;
  nudgeMinute: number;
  lastNudgeDate: string | null;
  /** JS weekday 0–6 (Sun–Sat); default Mon–Fri when unset in DB */
  activeWeekdays: number[];
}

export interface SanitizedMessage {
  id: string;
  authorId: string;
  authorMention: string;
  authorDisplayName: string;
  content: string;
  createdAt: Date;
}

export interface InvalidCheckIn {
  authorId: string;
  preview: string;
}

export interface StandupPipelineData {
  channelId: string;
  windowStart: Date;
  windowEnd: Date;
  messages: SanitizedMessage[];
  invalidCheckIns: InvalidCheckIn[];
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
    username: string;
    global_name?: string | null;
  };
  member?: {
    nick?: string | null;
  };
  attachments?: { id: string }[];
}
