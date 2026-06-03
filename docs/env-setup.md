# Environment variables — where to get each value

Copy [`.env.example`](../.env.example) to `.env` and fill in the values below. Never commit `.env` to git.

---

## Required variables

### `DISCORD_BOT_TOKEN`

**What it is:** Secret token for your Discord bot (read messages, post summaries, register slash commands).

**Where to get it:**

1. Open [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your application (or **New Application**).
3. Go to **Bot** in the left sidebar.
4. Click **Reset Token** or **View Token** and copy the value.
5. On the same page, enable **MESSAGE CONTENT INTENT** (required to read standup text).

**Invite the bot to your server:** **OAuth2** → **URL Generator** → scopes: `bot`, `applications.commands` → permissions: View Channel, Read Message History, Send Messages, Embed Links.

---

### `DISCORD_APPLICATION_ID`

**What it is:** Your Discord app’s numeric ID (used for slash commands and interactions).

**Where to get it:**

1. [Discord Developer Portal](https://discord.com/developers/applications) → your application.
2. **General Information** → **Application ID** → copy.

---

### `DISCORD_PUBLIC_KEY`

**What it is:** Public key used to verify that interaction requests really come from Discord.

**Where to get it:**

1. Same app → **General Information**.
2. **Public Key** → copy (64-character hex string).

**Also required in the portal:** set **Interactions Endpoint URL** to your deployed URL, e.g. `https://your-service.onrender.com/discord/interactions` (or an ngrok URL for local dev).

---

### `SUPABASE_URL`

**What it is:** Your Supabase project API URL (stores `/standup-config` settings).

**Where to get it:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (or create one).
3. **Project Settings** (gear) → **API**.
4. Copy **Project URL** (looks like `https://xxxxxxxx.supabase.co`).

**Before using the app:** run the SQL in [`supabase/migrations/001_standup_config.sql`](../supabase/migrations/001_standup_config.sql) in **SQL Editor** → **New query** → Run.

---

### `SUPABASE_SECRET_KEY`

**What it is:** Server-only Supabase secret API key (`sb_secret_...`) with full database access (bypasses RLS). Replaces the legacy JWT `service_role` key.

**Where to get it:**

1. Supabase Dashboard → **Project Settings** → **API Keys**.
2. Open the **Publishable and secret API keys** tab (not "Legacy anon, service_role").
3. Copy the **Secret key** (starts with `sb_secret_`).
4. If no secret key exists, click **Create new secret key**.

**Do not use** the publishable key (`sb_publishable_...`) for this bot — that is for client-side apps only.

**Warning:** Do not put this in frontend code, Discord messages, or public repos.

**Legacy fallback:** The app still accepts `SUPABASE_SERVICE_ROLE_KEY` temporarily with a deprecation warning. Migrate to `SUPABASE_SECRET_KEY`, then disable the legacy `service_role` key in the **Legacy** tab once nothing uses it (check "last used" indicators in the dashboard).

---

### `GEMINI_API_KEY`

**What it is:** API key for Google Gemini (standup summarization).

**Where to get it:**

1. Open [Google AI Studio](https://aistudio.google.com/apikey) (or [Google Cloud Console](https://console.cloud.google.com/) if you use Vertex).
2. Create an API key for the Gemini API.
3. Copy the key into `.env`.

---

### `CRON_SECRET`

**What it is:** A password you invent. Render’s cron job sends it as `Authorization: Bearer <CRON_SECRET>` when calling `/cron/standup`.

**Where to get it:** You generate it yourself.

**How to create a strong value:**

```powershell
# PowerShell — random 32-byte hex string
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
```

Or use any password manager / long random string (32+ characters).

**Use the same value** in:

- Local `.env`
- Render web service env
- Render cron job `Authorization` header

---

### `GEMINI_MODEL`

**What it is:** Which Gemini model to call.

**Where to get it:** Use the default in `.env.example` unless you want another supported model:

```
gemini-3.1-flash-lite
```

See [Google AI models](https://ai.google.dev/gemini-api/docs/models) for other options.

---

### `PORT`

**What it is:** HTTP port for the local dev server.

**Where to get it:** Use `3000` locally. On Render, leave unset — Render sets `PORT` automatically.

---

## Optional variables

### `DISCORD_GUILD_ID`

**What it is:** Your Discord server’s ID. When set, slash commands register to that server only (updates appear in seconds). When unset, commands register globally (can take up to an hour).

**Where to get it:**

1. Discord desktop or web → enable **Developer Mode**: **User Settings** → **Advanced** → **Developer Mode**.
2. Right-click your server icon → **Copy Server ID**.

---

### `DISCORD_CHANNEL_ID`

**What it is:** Bypass for Supabase — if set, the bot always uses this channel and ignores DB config. Useful for debugging; normal setup uses `/standup-config set` instead.

**Where to get it:**

1. With Developer Mode on, right-click the standup channel → **Copy Channel ID**.

**Leave unset** for the recommended flow (`/standup-config set` writes to Supabase).

---

## Quick checklist

| Step | Action |
|------|--------|
| 1 | Create Discord application, bot token, enable MESSAGE CONTENT |
| 2 | Copy Application ID + Public Key; set Interactions Endpoint URL |
| 3 | Invite bot to server with correct permissions |
| 4 | Create Supabase project, run migration SQL |
| 5 | Copy Supabase URL + secret key (`sb_secret_...`) |
| 6 | Create Gemini API key |
| 7 | Generate `CRON_SECRET` |
| 8 | `cp .env.example .env` and paste all values |
| 9 | `npm run dev` → `/standup-config set` in Discord |
| 10 | Test: `curl -X POST http://localhost:3000/cron/standup -H "Authorization: Bearer YOUR_CRON_SECRET"` |

---

## Related docs

- [setup.md](setup.md) — product specification
- [../.agents/AGENTS.md](../.agents/AGENTS.md) — deploy and architecture
