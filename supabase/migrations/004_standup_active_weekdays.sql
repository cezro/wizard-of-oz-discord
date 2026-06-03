-- Active weekdays for automated reminder, nudge, and summary (run after 003)

alter table standup_config
  add column if not exists active_weekdays integer[] not null default '{1,2,3,4,5}';

comment on column standup_config.active_weekdays is
  'JS weekday indices (0=Sun … 6=Sat). Default Mon–Fri.';
