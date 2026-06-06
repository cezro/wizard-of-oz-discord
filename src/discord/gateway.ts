import WebSocket from "ws";

import {
  clearMemberCache,
  ingestGuildMembersChunk,
  removeGuildMember,
  upsertGuildMember,
} from "./member-cache.js";

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
const GUILDS_INTENT = 1 << 0;
const GUILD_MEMBERS_INTENT = 1 << 1;
const GATEWAY_INTENTS = GUILDS_INTENT | GUILD_MEMBERS_INTENT;
const MAX_RECONNECT_DELAY_MS = 30_000;

const Opcodes = {
  Dispatch: 0,
  Heartbeat: 1,
  Identify: 2,
  Resume: 6,
  Reconnect: 7,
  InvalidSession: 9,
  Hello: 10,
  HeartbeatAck: 11,
} as const;

interface GatewayPayload {
  op: number;
  d?: unknown;
  s?: number | null;
  t?: string | null;
}

interface HelloData {
  heartbeat_interval: number;
}

interface ReadyData {
  session_id: string;
  user: { username: string };
}

interface GuildMembersChunkData {
  guild_id: string;
  members: { user: { id: string; bot?: boolean }; roles: string[] }[];
  chunk_index: number;
  chunk_count: number;
}

interface GuildMemberEventData {
  guild_id: string;
  user: { id: string; bot?: boolean };
  roles: string[];
}

export function startDiscordGateway(token: string): () => void {
  let ws: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let sessionId: string | null = null;
  let lastSequence: number | null = null;
  let intentionalClose = false;
  let reconnectAttempts = 0;
  let hadDisconnect = false;

  function clearHeartbeat(): void {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function send(payload: GatewayPayload): void {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  function identify(): void {
    clearMemberCache();
    send({
      op: Opcodes.Identify,
      d: {
        token,
        intents: GATEWAY_INTENTS,
        properties: {
          os: process.platform,
          browser: "wizard-of-oz-discord",
          device: "wizard-of-oz-discord",
        },
      },
    });
  }

  function resume(): void {
    if (!sessionId || lastSequence === null) {
      identify();
      return;
    }

    send({
      op: Opcodes.Resume,
      d: {
        token,
        session_id: sessionId,
        seq: lastSequence,
      },
    });
  }

  function startHeartbeat(intervalMs: number): void {
    clearHeartbeat();
    send({ op: Opcodes.Heartbeat, d: lastSequence });
    heartbeatTimer = setInterval(() => {
      send({ op: Opcodes.Heartbeat, d: lastSequence });
    }, intervalMs);
  }

  function scheduleReconnect(): void {
    if (intentionalClose) return;

    const delay = Math.min(
      1000 * 2 ** reconnectAttempts,
      MAX_RECONNECT_DELAY_MS,
    );
    reconnectAttempts++;
    setTimeout(connect, delay);
  }

  function handleDispatch(event: string, data: unknown): void {
    switch (event) {
      case "READY": {
        const ready = data as ReadyData;
        sessionId = ready.session_id;
        reconnectAttempts = 0;
        if (hadDisconnect) {
          console.log(`[gateway] reconnected as ${ready.user.username}`);
          hadDisconnect = false;
        } else {
          console.log(`[gateway] online as ${ready.user.username}`);
        }
        break;
      }
      case "GUILD_MEMBERS": {
        const chunk = data as GuildMembersChunkData;
        ingestGuildMembersChunk(
          chunk.guild_id,
          chunk.members,
          chunk.chunk_index,
          chunk.chunk_count,
        );
        break;
      }
      case "GUILD_MEMBER_ADD":
      case "GUILD_MEMBER_UPDATE": {
        const member = data as GuildMemberEventData;
        upsertGuildMember(
          member.guild_id,
          member.user.id,
          member.roles,
          member.user.bot ?? false,
        );
        break;
      }
      case "GUILD_MEMBER_REMOVE": {
        const member = data as GuildMemberEventData;
        removeGuildMember(member.guild_id, member.user.id);
        break;
      }
    }
  }

  function connect(): void {
    clearHeartbeat();
    ws = new WebSocket(GATEWAY_URL);

    ws.on("message", (raw) => {
      const payload = JSON.parse(raw.toString()) as GatewayPayload;

      if (payload.s !== null && payload.s !== undefined) {
        lastSequence = payload.s;
      }

      switch (payload.op) {
        case Opcodes.Hello: {
          const { heartbeat_interval } = payload.d as HelloData;
          startHeartbeat(heartbeat_interval);
          if (sessionId && lastSequence !== null) {
            resume();
          } else {
            identify();
          }
          break;
        }
        case Opcodes.HeartbeatAck:
          break;
        case Opcodes.Reconnect:
          ws?.close();
          break;
        case Opcodes.InvalidSession: {
          const resumable = payload.d as boolean;
          if (!resumable) {
            sessionId = null;
            clearMemberCache();
          }
          setTimeout(() => {
            if (resumable) {
              resume();
            } else {
              identify();
            }
          }, resumable ? 1000 : 5000);
          break;
        }
        case Opcodes.Dispatch:
          if (payload.t) {
            handleDispatch(payload.t, payload.d);
          }
          break;
      }
    });

    ws.on("close", (code, reason) => {
      clearHeartbeat();
      hadDisconnect = true;
      console.warn(`[gateway] disconnected (${code}): ${reason.toString()}`);
      if (!intentionalClose) {
        scheduleReconnect();
      }
    });

    ws.on("error", (error) => {
      console.error("[gateway]", error);
    });
  }

  connect();

  return () => {
    intentionalClose = true;
    clearHeartbeat();
    ws?.close();
  };
}
