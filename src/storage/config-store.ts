import type { AppConfig } from "../config.js";
import type { StandupTarget } from "../types.js";
import { normalizeActiveWeekdays } from "../utils/weekdays.js";
import { getSupabase, type StandupConfigRow } from "./supabase.js";

export interface UpsertConfigInput {
  guildId: string;
  channelId: string;
  timezone: string;
  updatedBy: string;
}

export interface UpdateScheduleInput {
  reminderHour?: number | null;
  reminderMinute?: number;
  summaryHour?: number;
  summaryMinute?: number;
  nudgeHour?: number | null;
  nudgeMinute?: number;
  updatedBy: string;
}

export interface UpdateReporterRoleInput {
  reporterRoleId: string | null;
  updatedBy: string;
}

export interface UpdateActiveWeekdaysInput {
  activeWeekdays: number[];
  updatedBy: string;
}

function rowToTarget(row: StandupConfigRow): StandupTarget {
  return {
    guildId: row.guild_id,
    channelId: row.channel_id,
    timezone: row.timezone,
    reminderHour: row.reminder_hour,
    reminderMinute: row.reminder_minute,
    summaryHour: row.summary_hour,
    summaryMinute: row.summary_minute,
    lastReminderDate: row.last_reminder_date,
    lastSummaryDate: row.last_summary_date,
    reporterRoleId: row.reporter_role_id,
    nudgeHour: row.nudge_hour,
    nudgeMinute: row.nudge_minute,
    lastNudgeDate: row.last_nudge_date,
    activeWeekdays: normalizeActiveWeekdays(row.active_weekdays),
  };
}

export async function getConfig(
  config: AppConfig,
  guildId: string,
): Promise<StandupConfigRow | null> {
  const supabase = getSupabase(config);
  const { data, error } = await supabase
    .from("standup_config")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load config: ${error.message}`);
  return data;
}

export async function getEnabledConfigs(
  config: AppConfig,
): Promise<StandupTarget[]> {
  const supabase = getSupabase(config);
  const { data, error } = await supabase
    .from("standup_config")
    .select("*")
    .eq("enabled", true)
    .order("guild_id");

  if (error) throw new Error(`Failed to load enabled configs: ${error.message}`);
  return (data ?? []).map(rowToTarget);
}

export async function upsertConfig(
  config: AppConfig,
  input: UpsertConfigInput,
): Promise<StandupConfigRow> {
  const supabase = getSupabase(config);
  const { data, error } = await supabase
    .from("standup_config")
    .upsert(
      {
        guild_id: input.guildId,
        channel_id: input.channelId,
        timezone: input.timezone,
        enabled: true,
        updated_by: input.updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guild_id" },
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to save config: ${error.message}`);
  return data;
}

export async function setEnabled(
  config: AppConfig,
  guildId: string,
  enabled: boolean,
  updatedBy: string,
): Promise<StandupConfigRow> {
  const existing = await getConfig(config, guildId);
  if (!existing) {
    throw new Error(
      "No configuration found for this server. Run /standup-config first.",
    );
  }

  const supabase = getSupabase(config);
  const { data, error } = await supabase
    .from("standup_config")
    .update({
      enabled,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("guild_id", guildId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update config: ${error.message}`);
  return data;
}

export async function updateSchedule(
  config: AppConfig,
  guildId: string,
  input: UpdateScheduleInput,
): Promise<StandupConfigRow> {
  const existing = await getConfig(config, guildId);
  if (!existing) {
    throw new Error(
      "No configuration found for this server. Run /standup-config first.",
    );
  }

  const patch: Record<string, unknown> = {
    updated_by: input.updatedBy,
    updated_at: new Date().toISOString(),
  };

  if (input.reminderHour !== undefined) patch.reminder_hour = input.reminderHour;
  if (input.reminderMinute !== undefined) {
    patch.reminder_minute = input.reminderMinute;
  }
  if (input.summaryHour !== undefined) patch.summary_hour = input.summaryHour;
  if (input.summaryMinute !== undefined) {
    patch.summary_minute = input.summaryMinute;
  }
  if (input.nudgeHour !== undefined) patch.nudge_hour = input.nudgeHour;
  if (input.nudgeMinute !== undefined) patch.nudge_minute = input.nudgeMinute;

  const supabase = getSupabase(config);
  const { data, error } = await supabase
    .from("standup_config")
    .update(patch)
    .eq("guild_id", guildId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update schedule: ${error.message}`);
  return data;
}

export async function markReminderSent(
  config: AppConfig,
  guildId: string,
  dateString: string,
): Promise<void> {
  const supabase = getSupabase(config);
  const { error } = await supabase
    .from("standup_config")
    .update({ last_reminder_date: dateString })
    .eq("guild_id", guildId);

  if (error) {
    throw new Error(`Failed to mark reminder sent: ${error.message}`);
  }
}

export async function markSummarySent(
  config: AppConfig,
  guildId: string,
  dateString: string,
): Promise<void> {
  const supabase = getSupabase(config);
  const { error } = await supabase
    .from("standup_config")
    .update({ last_summary_date: dateString })
    .eq("guild_id", guildId);

  if (error) {
    throw new Error(`Failed to mark summary sent: ${error.message}`);
  }
}

export async function updateActiveWeekdays(
  config: AppConfig,
  guildId: string,
  input: UpdateActiveWeekdaysInput,
): Promise<StandupConfigRow> {
  const existing = await getConfig(config, guildId);
  if (!existing) {
    throw new Error(
      "No configuration found for this server. Run /standup-config first.",
    );
  }

  const supabase = getSupabase(config);
  const { data, error } = await supabase
    .from("standup_config")
    .update({
      active_weekdays: input.activeWeekdays,
      updated_by: input.updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("guild_id", guildId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update active weekdays: ${error.message}`);
  }
  return data;
}

export interface PatchConfigInput {
  channelId?: string;
  timezone?: string;
  updatedBy: string;
}

export async function patchConfig(
  config: AppConfig,
  guildId: string,
  input: PatchConfigInput,
): Promise<StandupConfigRow> {
  const existing = await getConfig(config, guildId);
  if (!existing) {
    throw new Error(
      "No configuration found for this server. Use /standup-config to set up first.",
    );
  }

  const patch: Record<string, unknown> = {
    updated_by: input.updatedBy,
    updated_at: new Date().toISOString(),
  };
  if (input.channelId !== undefined) patch.channel_id = input.channelId;
  if (input.timezone !== undefined) patch.timezone = input.timezone;

  const supabase = getSupabase(config);
  const { data, error } = await supabase
    .from("standup_config")
    .update(patch)
    .eq("guild_id", guildId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update config: ${error.message}`);
  return data;
}

export async function updateReporterRole(
  config: AppConfig,
  guildId: string,
  input: UpdateReporterRoleInput,
): Promise<StandupConfigRow> {
  const existing = await getConfig(config, guildId);
  if (!existing) {
    throw new Error(
      "No configuration found for this server. Run /standup-config first.",
    );
  }

  const supabase = getSupabase(config);
  const { data, error } = await supabase
    .from("standup_config")
    .update({
      reporter_role_id: input.reporterRoleId,
      updated_by: input.updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("guild_id", guildId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update reporter role: ${error.message}`);
  return data;
}

export async function markNudgeSent(
  config: AppConfig,
  guildId: string,
  dateString: string,
): Promise<void> {
  const supabase = getSupabase(config);
  const { error } = await supabase
    .from("standup_config")
    .update({ last_nudge_date: dateString })
    .eq("guild_id", guildId);

  if (error) {
    throw new Error(`Failed to mark nudge sent: ${error.message}`);
  }
}

export function configRowToTarget(row: StandupConfigRow): StandupTarget {
  return rowToTarget(row);
}
