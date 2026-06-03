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

type ScheduleScreen = "hub" | "rem" | "sum" | "nud";

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

/** Discord allows one select menu per action row (no buttons in the same row). */
function scheduleCustomId(
  screen: ScheduleScreen,
  head: string,
  d: ScheduleDraft,
): string {
  return `${SCHEDULE_PREFIX}${screen}:${head}:${encodeScheduleDraft(d)}`;
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
  return buildScheduleHub(d, timezone);
}

function buildScheduleHub(
  d: ScheduleDraft,
  timezone: string,
): InteractionMessageData {
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
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Edit reminder",
            custom_id: scheduleCustomId("hub", "edit-rem", d),
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Edit summary",
            custom_id: scheduleCustomId("hub", "edit-sum", d),
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Edit nudge",
            custom_id: scheduleCustomId("hub", "edit-nud", d),
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
            custom_id: scheduleCustomId("hub", "save", d),
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

function buildReminderEditor(
  d: ScheduleDraft,
  timezone: string,
): InteractionMessageData {
  const disabled = d.reminderHour === null;

  return {
    embeds: [
      {
        title: "Reminder time",
        description: [
          `Timezone: \`${timezone}\``,
          disabled
            ? "Reminder is **off**. Turn it on to post a daily DSM prompt."
            : `Current: **${formatScheduleTime(d.reminderHour!, d.reminderMinute)}**`,
        ].join("\n"),
        color: EMBED_COLOR,
      },
    ],
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: scheduleCustomId("rem", "rh", d),
            placeholder: "Hour",
            options: hourOptions(d.reminderHour),
            disabled,
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: scheduleCustomId("rem", "rm", d),
            placeholder: "Minute",
            options: minuteOptions(d.reminderMinute),
            disabled,
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: disabled ? "Turn reminder on" : "Turn reminder off",
            custom_id: scheduleCustomId(
              "rem",
              disabled ? "ron" : "roff",
              d,
            ),
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Back",
            custom_id: scheduleCustomId("rem", "back", d),
          },
        ],
      },
    ],
  };
}

function buildSummaryEditor(
  d: ScheduleDraft,
  timezone: string,
): InteractionMessageData {
  return {
    embeds: [
      {
        title: "Summary time",
        description: [
          `Timezone: \`${timezone}\``,
          `Current: **${formatScheduleTime(d.summaryHour, d.summaryMinute)}**`,
        ].join("\n"),
        color: EMBED_COLOR,
      },
    ],
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: scheduleCustomId("sum", "sh", d),
            placeholder: "Hour",
            options: hourOptions(d.summaryHour),
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: scheduleCustomId("sum", "sm", d),
            placeholder: "Minute",
            options: minuteOptions(d.summaryMinute),
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Back",
            custom_id: scheduleCustomId("sum", "back", d),
          },
        ],
      },
    ],
  };
}

function buildNudgeEditor(
  d: ScheduleDraft,
  timezone: string,
): InteractionMessageData {
  const usesSummary = d.nudgeHour === null;

  return {
    embeds: [
      {
        title: "Missing DSM nudge",
        description: [
          `Timezone: \`${timezone}\``,
          usesSummary
            ? `Uses **summary time** (${formatScheduleTime(d.summaryHour, d.summaryMinute)}).`
            : `Custom time: **${formatScheduleTime(d.nudgeHour!, d.nudgeMinute)}**`,
        ].join("\n"),
        color: EMBED_COLOR,
      },
    ],
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: scheduleCustomId("nud", "nh", d),
            placeholder: "Hour",
            options: hourOptions(d.nudgeHour),
            disabled: usesSummary,
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: scheduleCustomId("nud", "nm", d),
            placeholder: "Minute",
            options: minuteOptions(d.nudgeMinute),
            disabled: usesSummary,
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: usesSummary ? "Set custom time" : "Use summary time",
            custom_id: scheduleCustomId(
              "nud",
              usesSummary ? "ncustom" : "nsummary",
              d,
            ),
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Back",
            custom_id: scheduleCustomId("nud", "back", d),
          },
        ],
      },
    ],
  };
}

function panelForScreen(
  screen: ScheduleScreen,
  d: ScheduleDraft,
  timezone: string,
): InteractionMessageData {
  switch (screen) {
    case "rem":
      return buildReminderEditor(d, timezone);
    case "sum":
      return buildSummaryEditor(d, timezone);
    case "nud":
      return buildNudgeEditor(d, timezone);
    default:
      return buildScheduleHub(d, timezone);
  }
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
):
  | { screen: ScheduleScreen; kind: "select"; field: string; draft: ScheduleDraft }
  | { screen: ScheduleScreen; kind: "button"; action: string; draft: ScheduleDraft }
  | null {
  if (!customId.startsWith(SCHEDULE_PREFIX)) return null;

  const rest = customId.slice(SCHEDULE_PREFIX.length);
  const firstColon = rest.indexOf(":");
  if (firstColon === -1) return null;

  const screen = rest.slice(0, firstColon) as ScheduleScreen;
  if (!["hub", "rem", "sum", "nud"].includes(screen)) return null;

  const tail = rest.slice(firstColon + 1);
  const secondColon = tail.indexOf(":");
  if (secondColon === -1) return null;

  const head = tail.slice(0, secondColon);
  const encoded = tail.slice(secondColon + 1);
  const draft = decodeScheduleDraft(encoded);
  if (!draft) return null;

  if (["rh", "rm", "sh", "sm", "nh", "nm"].includes(head)) {
    return { screen, kind: "select", field: head, draft };
  }
  return { screen, kind: "button", action: head, draft };
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
  const { timezone } = row;

  if (parsed.kind === "select") {
    const values = getSelectValues(interaction);
    if (values.length > 0) {
      draft = applySelect(parsed.field, values[0], draft);
    }
    return {
      type: 7,
      data: panelForScreen(parsed.screen, draft, timezone),
    };
  }

  switch (parsed.action) {
    case "edit-rem":
      return { type: 7, data: buildReminderEditor(draft, timezone) };
    case "edit-sum":
      return { type: 7, data: buildSummaryEditor(draft, timezone) };
    case "edit-nud":
      return { type: 7, data: buildNudgeEditor(draft, timezone) };
    case "back":
      return { type: 7, data: buildScheduleHub(draft, timezone) };
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

  return {
    type: 7,
    data: panelForScreen(parsed.screen, draft, timezone),
  };
}
