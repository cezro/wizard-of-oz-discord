# Changelog

## 2026-06-17 — Scheduler reminder failure + kicked-guild auto-cull

### Incident

On **2026-06-17**, the daily standup reminder did not fire for guild `1364793724877672588`. Render logs show **170 consecutive** `[cron/standup] tick skipped, previous still running` messages from `03:01` to `05:50` UTC — a single tick that started around `03:00` never completed for ~3 hours.

The previous day (`2026-06-16 03:00:12`) the same guild logged `reminderSent: true`, confirming the reminder schedule and code path are normally healthy.

### Root cause

1. **`tickInFlight` mutex** — [`src/cron/standup-tick.ts`](../src/cron/standup-tick.ts) allows only one standup tick at a time. While a tick is stuck, every subsequent minute tick is dropped with no retry.
2. **No fetch timeouts** — Discord REST calls in [`src/utils/discord-api.ts`](../src/utils/discord-api.ts) used bare `fetch` with no `AbortSignal`. A hung TCP connection (e.g. during `GET /guilds/{id}/members` in the daily reminder flow) can block the mutex indefinitely.

### Fix

| Change | File | Behavior |
|--------|------|----------|
| Per-guild tick timeout (2 min) | `src/cron/standup-tick.ts` | A stuck guild cannot hold the global mutex beyond 120s; other guilds and future ticks proceed |
| Discord fetch timeout (30s) | `src/utils/discord-api.ts` | Each Discord API request aborts after 30s instead of hanging forever |
| Guild access failure tracking | `supabase/migrations/005_standup_access_failures.sql` | New columns `access_failure_count`, `last_access_failure_at` on `standup_config` |
| Auto-cull after 5 failures | `src/standup/guild-access.ts`, `src/cron/standup-tick.ts` | Discord **10004 Unknown Guild** (bot kicked) increments a counter; at **5 consecutive** failures the guild config is auto-disabled (`enabled = false`) |

Channel-only errors (e.g. **50001 Missing Access**) do **not** count toward auto-cull — those are fixable via `/standup-config set channel:#your-standup-channel`.

### Secondary issue (ongoing log noise)

Guild `751138389507702844` has been failing since **2026-06-10** with `Unknown Guild` (10004) on reminders/nudges and `Missing Access` (50001) on summaries. The config remained `enabled=true` in Supabase, causing 3 failed API attempts per weekday. After deploy, this guild will be auto-disabled once it accumulates 5 consecutive 10004 failures (or can be disabled manually now).

### Ops checklist

1. Run [`supabase/migrations/005_standup_access_failures.sql`](../supabase/migrations/005_standup_access_failures.sql) in the Supabase SQL editor **before** deploying.
2. Deploy the updated service to Render.
3. (Optional) Immediately disable guild `751138389507702844` in Supabase: `update standup_config set enabled = false where guild_id = '751138389507702844';`

### References

- Log excerpt: [`docs/references/render-summarizer-logs-6-17-2026-1351.md`](references/render-summarizer-logs-6-17-2026-1351.md)

### Follow-up fixes (deploy required)

- **`/standup start` timed out** — Handler awaited `getConfig` + `runDailyReminder` before replying. Fixed: **defer immediately** (no awaits before defer), then load config and post in background.
- **`getEnabledConfigs` hung at tick start** — Ran before per-guild timeouts; a stuck Supabase call blocked the mutex for hours. Added **15s Supabase load timeout**.
- **Mutex force-release (5 min)** — Clears `tickInFlight` even if the inner promise never settles.
- **Whole-tick timeout (5 min)** + **Gemini timeout (90s)**.
- **Removed Supabase Realtime WebSocket** — Unused for this service; the `ws` transport could hold connections open unnecessarily.
- **Migration 005 fallback** — Access-failure counters no-op with a warning if columns are missing.

After deploy, confirm Render logs show `[discord/interactions] command=standup sub=start` when you run the command. If that line never appears, Discord is not reaching your Interactions Endpoint URL.

### Regression fix (07:52 deploy)

- **Supabase `ws` transport restored** — Removing `realtime: { transport: ws }` broke `createClient` on Node 20 (`Node.js 20 detected without native WebSocket support`), so every tick and `/standup start` failed at `getEnabledConfigs`.
- **`editDeferredInteraction` crash** — On webhook PATCH failure, `response.json()` then `response.text()` threw `Body is unusable` and **killed the process**. Fixed by reading the body once; errors are logged, not thrown.

### Stuck-bot implementation (audit plan)

Full write-up: [`docs/audit/2026-06-17-stuck-bot.md`](audit/2026-06-17-stuck-bot.md)

| Change | Files |
|--------|-------|
| Daily reminder uses role mention (no member pagination) | `src/standup/reminder.ts`, `src/egress/discord.ts` |
| 90s timeout + step logs on deferred `/standup` commands | `src/commands/standup.ts` |
| Gateway opcode 8 chunk requests + `GUILD_MEMBERS_CHUNK` fix | `src/discord/gateway.ts` |
| Member REST: 45s timeout, 20-page cap, cache hit/miss logs | `src/discord/guild-members.ts` |
| Removed startup duplicate tick; tick started/finished logs | `src/cron/internal-scheduler.ts`, `src/cron/standup-tick.ts` |
| 1-minute schedule grace window for reminder/nudge/summary | `src/utils/timezone.ts`, `src/cron/standup-tick.ts` |
