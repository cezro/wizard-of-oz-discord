import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

import type { AppConfig } from "../config.js";

export interface StandupConfigRow {
  guild_id: string;
  channel_id: string;
  timezone: string;
  enabled: boolean;
  updated_at: string;
  updated_by: string | null;
  reminder_hour: number | null;
  reminder_minute: number;
  summary_hour: number;
  summary_minute: number;
  last_reminder_date: string | null;
  last_summary_date: string | null;
  reporter_role_id: string | null;
  nudge_hour: number | null;
  nudge_minute: number;
  last_nudge_date: string | null;
  active_weekdays?: number[] | null;
}

let client: SupabaseClient | null = null;

export function getSupabase(config: AppConfig): SupabaseClient {
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: ws as never },
    });
  }
  return client;
}
