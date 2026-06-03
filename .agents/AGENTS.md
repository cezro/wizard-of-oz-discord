# Daily Standup Summarizer — Agent Guide

## Purpose

Node.js service that fetches standup messages from a Discord channel (last 24 hours), summarizes them with Gemini, and posts a rich embed summary. Guild settings (standup channel, timezone) are stored in **Supabase** and configured via `/standup-config` slash commands.

Source of truth: [docs/setup.md](../docs/setup.md).

## Architecture

| Layer | Path | Responsibility |
|-------|------|----------------|
| Ingress | `src/index.ts` | `/health`, `/cron/standup`, `/discord/interactions`, internal scheduler |
| Scheduler | `src/cron/internal-scheduler.ts` | Minute tick for reminders/nudges/summaries |
| Config store | `src/storage/config-store.ts` | Supabase CRUD for `standup_config` |
| Commands | `src/commands/standup-config.ts` | Slash command handlers |
| Ingestion | `src/ingestion/discord.ts` | Paginated fetch, sanitize, sort |
| Processing | `src/processing/gemini.ts` | Gemini summarization (skip if zero posts) |
| Egress | `src/egress/discord.ts` | Plain text (empty day) or rich embed |
| Orchestration | `src/pipeline.ts` | Per-guild pipeline via `StandupTarget` |

Use raw `fetch` for Discord REST (no `discord.js`).

## Supabase setup

1. Create a [Supabase](https://supabase.com) project.
2. Run [supabase/migrations/001_standup_config.sql](../supabase/migrations/001_standup_config.sql) in the SQL editor.
3. Copy **Project URL** and **secret key** (Settings → API Keys → Publishable and secret → `sb_secret_...`) into env vars. Never expose the secret key to clients.

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DISCORD_BOT_TOKEN` | Yes | Read history + post messages |
| `DISCORD_APPLICATION_ID` | Yes | Slash commands + interactions |
| `DISCORD_PUBLIC_KEY` | Yes | Interaction signature verification |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Yes | Server-only (`sb_secret_...`; legacy `SUPABASE_SERVICE_ROLE_KEY` still accepted) |
| `GEMINI_API_KEY` | Yes | Google GenAI |
| `CRON_SECRET` | Yes | Bearer auth on optional `POST /cron/standup` |
| `STANDUP_INTERNAL_SCHEDULER` | No | Default on; in-process minute tick |
| `PORT` | No | Default `3000` |
| `GEMINI_MODEL` | No | Default `gemini-3.1-flash-lite` |

Per-server settings (standup channel, timezone) live in **Supabase** via `/standup-config` in each Discord server — not in env vars. Slash commands register **globally** at startup.

## Discord bot setup

1. [Discord Developer Portal](https://discord.com/developers/applications) → Bot → enable **MESSAGE_CONTENT** intent.
2. General Information → copy **Application ID** and **Public Key**.
3. Set **Interactions Endpoint URL** to `https://<your-host>/discord/interactions`.
4. Invite with: View Channel, Read Message History, Send Messages, Embed Links, Use Application Commands.

## Configure in Discord

```
/standup-config set channel:#daily-standup
/standup-config show
/standup-config disable
/standup-config enable
```

Requires **Manage Server** permission.

## Render.com deploy checklist

1. Run Supabase migration; set `SUPABASE_*` and Discord env vars on the web service.
2. Deploy; confirm `/health` returns OK.
3. Set Interactions Endpoint URL in Discord to your Render URL.
4. Ensure `STANDUP_INTERNAL_SCHEDULER` is on (default) so reminders/nudges/summaries run in-process every minute. No Render Cron Job required.
5. Run `/standup-config set` in each server before that server's first scheduled summary.

## Environment setup

See [docs/env-setup.md](../docs/env-setup.md) for step-by-step instructions on where to obtain every value in `.env.example`.

## Local dev

```bash
cp .env.example .env
npm install
npm run dev
curl http://localhost:3000/health
curl -X POST http://localhost:3000/cron/standup -H "Authorization: Bearer $CRON_SECRET"
```

For local slash commands, expose port 3000 with a tunnel (e.g. ngrok) and point Discord Interactions Endpoint to `https://<tunnel>/discord/interactions`.

## Skills

- `.agents/skills/discord-bot/` — general Discord patterns
- `.agents/skills/standup-summarizer/` — project-specific rules
