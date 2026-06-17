import WebSocket from "ws";

import {
  clearMemberCache,
  ingestGuildMembersChunk,
  isGuildMemberCacheReady,
  removeGuildMember,
  upsertGuildMember,
} from "./member-cache.js";

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
const GUILDS_INTENT = 1 << 0;
const GUILD_MEMBERS_INTENT = 1 << 1;
const GATEWAY_INTENTS = GUILDS_INTENT | GUILD_MEMBERS_INTENT;
const MAX_RECONNECT_DELAY_MS = 30_000;
const CHUNK_REQUEST_INTERVAL_MS = 5_000;

const Opcodes = {
  Dispatch: 0,
  Heartbeat: 1,
  Identify: 2,
  RequestGuildMembers: 8,
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

interface GuildCreateData {
  id: string;
  unavailable?: boolean;
}

export function startDiscordGateway(token: string): () => void {
  let ws: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let sessionId: string | null = null;
  let lastSequence: number | null = null;
  let intentionalClose = false;
  let reconnectAttempts = 0;
  let hadDisconnect = false;
  const chunkQueue: string[] = [];
  const chunkQueued = new Set<string>();
  let chunkDrainTimer: ReturnType<typeof setTimeout> | null = null;

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

  function requestMemberChunk(guildId: string): void {
    console.log(`[gateway] requested member chunk for guild ${guildId}`);
    send({
      op: Opcodes.RequestGuildMembers,
      d: {
        guild_id: guildId,
        query: "",
        limit: 0,
      },
    });
  }

  function enqueueMemberChunkRequest(guildId: string): void {
    if (chunkQueued.has(guildId) || isGuildMemberCacheReady(guildId)) {
      return;
    }
    chunkQueued.add(guildId);
    chunkQueue.push(guildId);
    if (!chunkDrainTimer) {
      chunkDrainTimer = setTimeout(drainChunkQueue, 0);
    }
  }

  function drainChunkQueue(): void {
    chunkDrainTimer = null;
    const guildId = chunkQueue.shift();
    if (!guildId) return;

    requestMemberChunk(guildId);

    if (chunkQueue.length > 0) {
      chunkDrainTimer = setTimeout(drainChunkQueue, CHUNK_REQUEST_INTERVAL_MS);
    }
  }

  function identify(): void {
    clearMemberCache();
    chunkQueue.length = 0;
    chunkQueued.clear();
    if (chunkDrainTimer) {
      clearTimeout(chunkDrainTimer);
      chunkDrainTimer = null;
    }
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
      case "GUILD_CREATE": {
        const guild = data as GuildCreateData;
        if (!guild.unavailable) {
          enqueueMemberChunkRequest(guild.id);
        }
        break;
      }
      case "GUILD_MEMBERS_CHUNK": {
        const chunk = data as GuildMembersChunkData;
        ingestGuildMembersChunk(
          chunk.guild_id,
          chunk.members,
          chunk.chunk_index,
          chunk.chunk_count,
        );
        if (isGuildMemberCacheReady(chunk.guild_id)) {
          console.log(
            `[gateway] member cache ready for guild ${chunk.guild_id}`,
          );
        }
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
    if (chunkDrainTimer) clearTimeout(chunkDrainTimer);
    ws?.close();
  };
}
