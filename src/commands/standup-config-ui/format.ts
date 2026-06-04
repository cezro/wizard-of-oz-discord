import type { StandupConfigRow } from "../../storage/supabase.js";
import { configRowToTarget } from "../../storage/config-store.js";
import { formatScheduleTime } from "../../utils/timezone.js";
import {
  formatActiveWeekdays,
  normalizeActiveWeekdays,
} from "../../utils/weekdays.js";

export function formatNudgeSchedule(row: StandupConfigRow): string {
  if (row.nudge_hour === null) {
    const summaryTime = formatScheduleTime(row.summary_hour, row.summary_minute);
    return `same as summary (**${summaryTime}** \`${row.timezone}\`)`;
  }
  const time = formatScheduleTime(row.nudge_hour, row.nudge_minute);
  return `**${time}** (\`${row.timezone}\`)`;
}

export function formatReminderSchedule(row: StandupConfigRow): string {
  if (row.reminder_hour === null) {
    return "disabled";
  }
  return `${formatScheduleTime(row.reminder_hour, row.reminder_minute)} (\`${row.timezone}\`)`;
}

export function buildHubDescription(row: StandupConfigRow | null): string {
  if (!row) {
    return [
      "No standup configuration yet.",
      "",
      "Use **Channel** to pick the DSM channel and timezone, then configure the rest.",
    ].join("\n");
  }

  const reporterRole = row.reporter_role_id
    ? `<@&${row.reporter_role_id}>`
    : "not set";
  const reminder = formatReminderSchedule(row);
  const summary = `${formatScheduleTime(row.summary_hour, row.summary_minute)} (\`${row.timezone}\`)`;
  const nudge = formatNudgeSchedule(row);

  return [
    `**Channel:** <#${row.channel_id}>`,
    `**Timezone:** \`${row.timezone}\``,
    `**Enabled:** ${row.enabled ? "yes" : "no"}`,
    `**Active days:** ${formatActiveWeekdays(normalizeActiveWeekdays(row.active_weekdays))}`,
    `**Reporter role:** ${reporterRole}`,
    `**Daily reminder** (morning prompt): ${reminder}`,
    `**Missing DSM nudge** (End of Day, @missing): ${nudge}`,
    `**Summary** (Gemini digest): ${summary}`,
    `**Last reminder:** ${row.last_reminder_date ?? "never"}`,
    `**Last nudge:** ${row.last_nudge_date ?? "never"}`,
    `**Last summary:** ${row.last_summary_date ?? "never"}`,
  ].join("\n");
}

export { configRowToTarget };
