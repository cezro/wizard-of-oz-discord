-- Reporter role and end-of-day missing-DSM nudge (run after 002_standup_schedule.sql)

alter table standup_config
  add column reporter_role_id text,
  add column nudge_hour smallint,
  add column nudge_minute smallint not null default 0,
  add column last_nudge_date date;
