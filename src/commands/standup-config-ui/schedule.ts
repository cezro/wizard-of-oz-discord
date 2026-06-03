import type { AppConfig } from "../../config.js";
import {
  ephemeral,
  getInteractionCustomId,
  getSelectValues,
  getUserId,
  type DiscordInteraction,
  type InteractionMessageData,
  type InteractionResponse,
} from "../../discord/interaction-utils.js";
import { updateSchedule } from "../../storage/config-store.js";
import type { StandupConfigRow } from "../../storage/supabase.js";
import { formatScheduleTime } from "../../utils/timezone.js";
import { NAV_HOME, SCHEDULE_PREFIX } from "./custom-ids.js";
import {
  ACTION_ROW,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BUTTON,
  EMBED_COLOR,
  hourOptions,
  minuteOptions,
  STRING_SELECT,
} from "./components.js";
import { buildHomePayload } from "./home.js";

export interface ScheduleDraft {
  reminderHour: number | null;
  reminderMinute: number;
  summaryHour: number;
  summaryMinute: number;
  nudgeHour: number | null;
  nudgeMinute: number;
}

export function draftFromRow(row: StandupConfigRow): ScheduleDraft {
  return {
    reminderHour: row.reminder_hour,
    reminderMinute: row.reminder_minute,
    summaryHour: row.summary_hour,
    summaryMinute: row.summary_minute,
    nudgeHour: row.nudge_hour,
    nudgeMinute: row.nudge_minute,
  };
}

function encHour(h: number | null): string {
  return h === null ? "x" : String(h);
}

export function encodeScheduleDraft(d: ScheduleDraft): string {
  return [
    encHour(d.reminderHour),
    d.reminderMinute,
    d.summaryHour,
    d.summaryMinute,
    encHour(d.nudgeHour),
    d.nudgeMinute,
  ].join(":");
}

export function decodeScheduleDraft(encoded: string): ScheduleDraft | null {
  const parts = encoded.split(":");
  if (parts.length !== 6) return null;

  const parseHour = (s: string): number | null =>
    s === "x" ? null : Number(s);

  const reminderHour = parseHour(parts[0]);
  const reminderMinute = Number(parts[1]);
  const summaryHour = Number(parts[2]);
  const summaryMinute = Number(parts[3]);
  const nudgeHour = parseHour(parts[4]);
  const nudgeMinute = Number(parts[5]);

  if (
    (reminderHour !== null && !Number.isInteger(reminderHour)) ||
    !Number.isInteger(reminderMinute) ||
    !Number.isInteger(summaryHour) ||
    !Number.isInteger(summaryMinute) ||
    (nudgeHour !== null && !Number.isInteger(nudgeHour)) ||
    !Number.isInteger(nudgeMinute)
  ) {
    return null;
  }

  return {
    reminderHour,
    reminderMinute,
    summaryHour,
    summaryMinute,
    nudgeHour,
    nudgeMinute,
  };
}

function selectId(field: string, d: ScheduleDraft): string {
  return `${SCHEDULE_PREFIX}${field}:${encodeScheduleDraft(d)}`;
}

function buttonId(action: string, d: ScheduleDraft): string {
  return `${SCHEDULE_PREFIX}${action}:${encodeScheduleDraft(d)}`;
}

function formatDraftDescription(d: ScheduleDraft, timezone: string): string {
  const reminder =
    d.reminderHour === null
      ? "disabled"
      : formatScheduleTime(d.reminderHour, d.reminderMinute);
  const summary = formatScheduleTime(d.summaryHour, d.summaryMinute);
  const nudge =
    d.nudgeHour === null
      ? `same as summary (${formatScheduleTime(d.summaryHour, d.summaryMinute)})`
      : formatScheduleTime(d.nudgeHour, d.nudgeMinute);

  return [
    "Set automated schedule times in guild timezone.",
    "",
    `**Reminder:** ${reminder}`,
    `**Summary:** ${summary}`,
    `**Missing DSM nudge:** ${nudge}`,
    `**Timezone:** \`${timezone}\``,
  ].join("\n");
}

export function buildSchedulePanel(
  d: ScheduleDraft,
  timezone: string,
): InteractionMessageData {
  const reminderDisabled = d.reminderHour === null;
  const nudgeUsesSummary = d.nudgeHour === null;

  return {
    embeds: [
      {
        title: "Schedule",
        description: formatDraftDescription(d, timezone),
        color: EMBED_COLOR,
      },
    ],
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: selectId("rh", d),
            placeholder: "Reminder hour",
            options: hourOptions(),
            disabled: reminderDisabled,
            ...(d.reminderHour !== null
              ? { default_values: [String(d.reminderHour)] }
              : {}),
          },
          {
            type: STRING_SELECT,
            custom_id: selectId("rm", d),
            placeholder: "Reminder min",
            options: minuteOptions(),
            disabled: reminderDisabled,
            default_values: [String(d.reminderMinute)],
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: reminderDisabled ? "Reminder on" : "Reminder off",
            custom_id: buttonId(reminderDisabled ? "ron" : "roff", d),
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: selectId("sh", d),
            placeholder: "Summary hour",
            options: hourOptions(),
            default_values: [String(d.summaryHour)],
          },
          {
            type: STRING_SELECT,
            custom_id: selectId("sm", d),
            placeholder: "Summary min",
            options: minuteOptions(),
            default_values: [String(d.summaryMinute)],
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: selectId("nh", d),
            placeholder: "Nudge hour",
            options: hourOptions(),
            disabled: nudgeUsesSummary,
            ...(d.nudgeHour !== null
              ? { default_values: [String(d.nudgeHour)] }
              : {}),
          },
          {
            type: STRING_SELECT,
            custom_id: selectId("nm", d),
            placeholder: "Nudge min",
            options: minuteOptions(),
            disabled: nudgeUsesSummary,
            default_values: [String(d.nudgeMinute)],
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: nudgeUsesSummary ? "Nudge: custom" : "Nudge: = summary",
            custom_id: buttonId(nudgeUsesSummary ? "ncustom" : "nsummary", d),
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            style: BTN_PRIMARY,
            label: "Save",
            custom_id: buttonId("save", d),
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Back",
            custom_id: NAV_HOME,
          },
        ],
      },
    ],
  };
}

function applySelect(
  field: string,
  value: string,
  d: ScheduleDraft,
): ScheduleDraft {
  const n = Number(value);
  const next = { ...d };
  switch (field) {
    case "rh":
      next.reminderHour = n;
      break;
    case "rm":
      next.reminderMinute = n;
      break;
    case "sh":
      next.summaryHour = n;
      break;
    case "sm":
      next.summaryMinute = n;
      break;
    case "nh":
      next.nudgeHour = n;
      break;
    case "nm":
      next.nudgeMinute = n;
      break;
  }
  return next;
}

export function parseScheduleInteraction(
  customId: string,
): { kind: "select"; field: string; draft: ScheduleDraft } | { kind: "button"; action: string; draft: ScheduleDraft } | null {
  if (!customId.startsWith(SCHEDULE_PREFIX)) return null;
  const rest = customId.slice(SCHEDULE_PREFIX.length);
  const colon = rest.indexOf(":");
  if (colon === -1) return null;
  const head = rest.slice(0, colon);
  const encoded = rest.slice(colon + 1);
  const draft = decodeScheduleDraft(encoded);
  if (!draft) return null;

  if (["rh", "rm", "sh", "sm", "nh", "nm"].includes(head)) {
    return { kind: "select", field: head, draft };
  }
  return { kind: "button", action: head, draft };
}

export async function handleScheduleInteraction(
  config: AppConfig,
  guildId: string,
  interaction: DiscordInteraction,
  row: StandupConfigRow,
  loadHome: (guildId: string) => Promise<StandupConfigRow | null>,
): Promise<InteractionResponse> {
  const customId = getInteractionCustomId(interaction);
  if (!customId) return ephemeral("Unknown schedule control.");

  const parsed = parseScheduleInteraction(customId);
  if (!parsed) return ephemeral("Unknown schedule control.");

  let draft = parsed.draft;

  if (parsed.kind === "select") {
    const values = getSelectValues(interaction);
    if (values.length === 0) {
      return { type: 7, data: buildSchedulePanel(draft, row.timezone) };
    }
    draft = applySelect(parsed.field, values[0], draft);
    return { type: 7, data: buildSchedulePanel(draft, row.timezone) };
  }

  switch (parsed.action) {
    case "roff":
      draft = { ...draft, reminderHour: null };
      break;
    case "ron":
      draft = {
        ...draft,
        reminderHour: draft.summaryHour,
        reminderMinute: draft.reminderMinute,
      };
      break;
    case "nsummary":
      draft = { ...draft, nudgeHour: null };
      break;
    case "ncustom":
      draft = {
        ...draft,
        nudgeHour: draft.summaryHour,
        nudgeMinute: draft.summaryMinute,
      };
      break;
    case "save": {
      await updateSchedule(config, guildId, {
        reminderHour: draft.reminderHour,
        reminderMinute: draft.reminderMinute,
        summaryHour: draft.summaryHour,
        summaryMinute: draft.summaryMinute,
        nudgeHour: draft.nudgeHour,
        nudgeMinute: draft.nudgeMinute,
        updatedBy: getUserId(interaction),
      });
      const updated = await loadHome(guildId);
      return { type: 7, data: buildHomePayload(updated) };
    }
    default:
      return ephemeral("Unknown schedule action.");
  }

  return { type: 7, data: buildSchedulePanel(draft, row.timezone) };
}
