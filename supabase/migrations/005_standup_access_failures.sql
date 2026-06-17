-- Track consecutive guild-access failures for auto-disable when bot is kicked

alter table standup_config
  add column access_failure_count integer not null default 0,
  add column last_access_failure_at timestamptz;
