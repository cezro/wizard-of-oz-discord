-- Per-guild reminder and summary schedule (run after 001_standup_config.sql)

alter table standup_config
  add column reminder_hour smallint,
  add column reminder_minute smallint not null default 0,
  add column summary_hour smallint not null default 17,
  add column summary_minute smallint not null default 0,
  add column last_reminder_date date,
  add column last_summary_date date;
