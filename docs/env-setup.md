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

**Invite the bot to your server:** **OAuth2** → **URL Generator**:

1. Under **Scopes**, enable **`bot`** and **`applications.commands`** (both are required).
2. Under **Bot Permissions**, enable: View Channel, Read Message History, Send Messages, Embed Links.
3. Copy the generated URL, open it in a browser, and select your server.

Using only `applications.commands` (without `bot`) can show the app under **Server Settings → Integrations** without adding the bot user to the member list. If that happened, generate a new URL with both scopes and authorize again on the same server (you do not need to kick the app first).

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

## Multi-server setup

The bot works in **any server** you invite it to. No server or channel IDs go in `.env`.

1. Invite the bot to each server (OAuth2 URL with `bot` + `applications.commands`).
2. Slash commands register **globally** when the app starts (may take up to ~1 hour the first time).
3. In **each** server, run `/standup-config set` to choose the standup channel and timezone (stored in Supabase).
4. Cron (`POST /cron/standup`) runs the pipeline for **every enabled** server in the database.

---

## Bot not in member list?

This project is an **HTTP-only** bot (REST + Interactions). It does not connect to Discord’s Gateway, so the bot will appear **offline (gray)** when it is a member—not green/online. That is normal and does not break standups or slash commands.

If the bot does not appear in the member list **at all** (even after searching), the bot user was likely never added to the guild.

### Integrations vs member list

| Location | Meaning |
|----------|---------|
| **Server Settings → Integrations** | An application is authorized (commands, webhooks, or app install). |
| **Member list / Server Settings → Members** | The **bot user** is a server member (requires the `bot` OAuth scope on invite). |

### Fix: re-invite with both scopes

1. [Discord Developer Portal](https://discord.com/developers/applications) → your app → **OAuth2** → **URL Generator**.
2. Scopes: **`bot`** and **`applications.commands`**.
3. Bot permissions: View Channel, Read Message History, Send Messages, Embed Links.
4. Open the URL and authorize on the correct server.

Also check **Server Settings → Members** (search the bot name), not only the channel sidebar. Enable offline members in **User Settings → Appearance** if needed.

### Confirm membership (API)

Enable **Developer Mode**, right-click your server → **Copy Server ID**, then check membership (replace `GUILD_ID` and use your bot token and application ID from `.env`):

```powershell
# PowerShell (loads .env from project root)
cd path\to\wizard-of-oz-discord
node --import dotenv/config -e "
const g = 'GUILD_ID';
const a = process.env.DISCORD_APPLICATION_ID;
const t = process.env.DISCORD_BOT_TOKEN;
fetch('https://discord.com/api/v10/guilds/' + g + '/members/' + a, {
  headers: { Authorization: 'Bot ' + t }
}).then(r => r.json().then(j => console.log(r.status, j)));
"
```

Or with curl:

```bash
curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  "https://discord.com/api/v10/guilds/GUILD_ID/members/APPLICATION_ID"
```

| Response | Meaning |
|----------|---------|
| **200** + member JSON | Bot is in the guild. If the sidebar still hides it, expand offline members or check channel vs server member views. |
| **404** Unknown Member | Bot was not added with the `bot` scope; re-invite using the steps above. |

`APPLICATION_ID` is the same value as `DISCORD_APPLICATION_ID`.

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
