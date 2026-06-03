---
name: standup-summarizer
description: >-
  Daily Discord standup ingestion, Gemini summarization, embed broadcast, and
  /standup-config slash commands backed by Supabase.
  Use when working on the standup pipeline, cron endpoint, interactions, or
  docs/setup.md behavior.
version: "1.2.0"
---

# Standup Summarizer

Project-specific skill for the wizard-of-oz-discord standup bot.

## When to apply

- Changing `src/ingestion`, `src/processing`, `src/egress`, or `src/pipeline.ts`
- `/standup-config` slash commands or `src/storage/config-store.ts`
- Cron auth, timezone window, Supabase, or Render deployment
- Gemini prompts or embed formatting

## Non-negotiables (from docs/setup.md)

1. **Schedule:** Mon–Fri end-of-day 17:00 Asia/Manila; **cron** fetch window = inclusive rolling 24 hours (`windowStart` ≤ message timestamp ≤ `windowEnd`), both bounds enforced at ingestion. **`/standup summarize`** uses a calendar day in guild timezone (optional `date`, default today).
2. **Zero posts:** Do not call Gemini. Post: "No standup updates recorded for today! Hope everyone had a productive day."
3. **Sanitize:** Exclude system messages, bot messages, emoji-only posts.
4. **Order:** Oldest → newest before Gemini.
5. **Summary headings (exact):**
   - `### Key Accomplishments`
   - `### Active Focus Areas`
   - `### Blockers & Dependencies`
6. **Attribution:** Every bullet keeps Discord mentions (`<@userId>`) as ingested.
7. **Egress:** Bot API only; rich embed title `📊 Daily Standup Summary - [date]`; attach full markdown as `standup-summary-YYYY-MM-DD.md` on every summary post.
8. **Cron security:** `Authorization: Bearer ${CRON_SECRET}` on `POST /cron/standup`.
9. **Channel config:** Per-server via Supabase only (`/standup-config set`); cron loads all enabled rows.
10. **Missing DSM nudge:** Same rolling 24h ingestion window as cron summary; compares role members (`GET /guilds/{id}/members`) to message `authorId`s; cron marks `last_nudge_date` once per local day (silent if everyone posted). Requires Server Members Intent.

## File map

```
src/
  index.ts                    # /health, /cron/standup, /discord/interactions
  config.ts                   # env + resolveStandupTargets()
  storage/config-store.ts     # Supabase CRUD
  commands/register.ts        # slash command registration
  commands/standup.ts         # schedule + nudge slash handlers
  commands/standup-config.ts  # slash handlers
  cron/standup-tick.ts        # reminder, nudge, summary tick
  standup/missing-reporters.ts
  discord/guild-members.ts    # paginated member list, filter by role
  discord/gateway.ts          # GUILDS | GUILD_MEMBERS intents
  discord/verify.ts           # interaction signatures
  pipeline.ts                 # runPipeline / runAllPipelines
  ingestion/discord.ts
  processing/gemini.ts, prompts.ts
  egress/discord.ts
supabase/migrations/001_standup_config.sql
supabase/migrations/003_standup_reporter_role.sql
```

## Defaults

- Model: `gemini-3.1-flash-lite`, temperature `0.1`
- Timezone: `Asia/Manila` (per-guild override in DB)
- Discord: raw REST `fetch`, not discord.js

## Extension

Additional persistence should extend `standup_config` or hook after `ingestStandupMessages()`, before `processStandup()`.
