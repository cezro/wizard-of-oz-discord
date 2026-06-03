---
name: standup-summarizer
description: >-
  Daily Discord standup ingestion, Gemini summarization, embed broadcast, and
  /standup-config slash commands backed by Supabase.
  Use when working on the standup pipeline, cron endpoint, interactions, or
  docs/setup.md behavior.
version: "1.3.0"
---

# Standup Summarizer

Project-specific skill for the wizard-of-oz-discord standup bot.

## When to apply

- Changing `src/ingestion`, `src/processing`, `src/egress`, or `src/pipeline.ts`
- `/standup-config` slash commands or `src/storage/config-store.ts`
- Internal scheduler, optional `/cron/standup`, timezone window, Supabase, or Render deployment
- Gemini prompts or embed formatting

## Non-negotiables (from docs/setup.md)

1. **Schedule:** Per-guild active weekdays (default Mon–Fri via `active_weekdays`); the minute tick skips reminder/nudge/summary on other days. Default summary time 17:00 Asia/Manila. **Scheduled (tick)** fetch window = inclusive rolling 24 hours (`windowStart` ≤ message timestamp ≤ `windowEnd`), both bounds enforced at ingestion. **`/standup summarize`** uses a calendar day in guild timezone (optional `month` / `day` / `year`; unset fields default to today). In-process scheduler (`STANDUP_INTERNAL_SCHEDULER`, default on) replaces a separate Render Cron Job.
2. **Zero posts:** Do not call Gemini. Post: "No standup updates recorded for today! Hope everyone had a productive day."
3. **Sanitize:** Exclude system messages, bot messages, emoji-only posts, and invalid DSM check-ins (heuristic in `src/utils/dsm-validation.ts`; attachment-only posts count). Same rules for summaries and missing-reporter nudges.
4. **Order:** Oldest → newest before Gemini.
5. **Summary headings (exact):**
   - `### Key Accomplishments`
   - `### Active Focus Areas`
   - `### Blockers & Dependencies`
6. **Attribution:** Every bullet keeps Discord mentions (`<@userId>`) as ingested.
7. **Egress:** Bot API only; Components V2 Container + Text Display title `📊 Daily Standup Summary - [date]`; hidden `standup-summary-YYYY-MM-DD.md` attachment with **Download Markdown** link button; file export uses `@displayName` not `<@userId>`.
8. **HTTP tick security:** `Authorization: Bearer ${CRON_SECRET}` on optional `POST /cron/standup`.
9. **Channel config:** Per-server via Supabase only (`/standup-config` hub); tick loads all enabled rows.
10. **Missing DSM nudge:** Same rolling 24h ingestion window as scheduled summary; compares role members (`GET /guilds/{id}/members`) to authors with **valid** check-ins only; invalid posts reported in `/standup remind-missing` ephemeral reply; tick marks `last_nudge_date` once per local day (silent if everyone posted). Requires Server Members Intent.

## File map

```
src/
  index.ts                    # /health, /cron/standup, /discord/interactions, starts scheduler
  cron/internal-scheduler.ts  # minute tick (STANDUP_INTERNAL_SCHEDULER)
  config.ts                   # env + resolveStandupTargets()
  storage/config-store.ts     # Supabase CRUD
  commands/register.ts        # slash command registration
  commands/standup.ts         # summarize + remind-missing handlers
  commands/standup-config.ts  # re-exports standup-config-ui
  commands/standup-config-ui/  # hub embed + nested panels (channel, schedule, active days, role)
  cron/standup-tick.ts        # reminder, nudge, summary tick
  standup/reminder.ts         # daily DSM reminder + reporter pings
  standup/missing-reporters.ts
  discord/guild-members.ts    # paginated member list, filter by role
  discord/gateway.ts          # GUILDS | GUILD_MEMBERS intents
  discord/verify.ts           # interaction signatures
  pipeline.ts                 # runPipeline / runAllPipelines
  ingestion/discord.ts
  utils/dsm-validation.ts
  processing/gemini.ts, prompts.ts
  egress/discord.ts
supabase/migrations/001_standup_config.sql
supabase/migrations/003_standup_reporter_role.sql
supabase/migrations/004_standup_active_weekdays.sql
  utils/weekdays.ts
```

## Defaults

- Model: `gemini-3.1-flash-lite`, temperature `0.1`
- Timezone: `Asia/Manila` (per-guild override in DB)
- Discord: raw REST `fetch`, not discord.js

## Extension

Additional persistence should extend `standup_config` or hook after `ingestStandupMessages()`, before `processStandup()`.
