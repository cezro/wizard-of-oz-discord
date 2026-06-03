import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { AppConfig } from "../config.js";

export interface StandupConfigRow {
  guild_id: string;
  channel_id: string;
  timezone: string;
  enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

let client: SupabaseClient | null = null;

export function getSupabase(config: AppConfig): SupabaseClient {
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
