-- Standup bot guild configuration (run in Supabase SQL editor or via CLI)

create table standup_config (
  guild_id text primary key,
  channel_id text not null,
  timezone text not null default 'Asia/Manila',
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text
);

create index standup_config_enabled_idx on standup_config (enabled) where enabled = true;

-- Optional: deny public access; service role bypasses RLS
alter table standup_config enable row level security;

create policy "deny_anon" on standup_config
  for all
  to anon, authenticated
  using (false);
