import { EventEmitter } from "node:events";
import net from "node:net";
import tls from "node:tls";
import { GameRoom, RoomView } from "./game-store";

const ROOM_TTL_SEC = 2 * 60 * 60; // 2 hours

export interface GameRoomAdapter {
  name: "memory" | "redis-tcp" | "redis-rest";
  get(pin: string): Promise<GameRoom | undefined>;
  save(room: GameRoom): Promise<void>;
  delete(pin: string): Promise<void>;
  publish(pin: string, view: RoomView): Promise<void>;
  subscribe(pin: string, cb: (view: RoomView) => void): () => void;
}

// -------------------------------------------------------------
// 1. IN-MEMORY ADAPTER (Default: zero config, local classroom)
// -------------------------------------------------------------
declare global {
  var __gameRoomsMap: Map<string, GameRoom> | undefined;
  var __gameRoomEmitter: EventEmitter | undefined;
}

export class MemoryRoomAdapter implements GameRoomAdapter {
  readonly name = "memory";
  private rooms: Map<string, GameRoom>;
  private emitter: EventEmitter;

  constructor() {
    this.rooms = (globalThis.__gameRoomsMap ??= new Map<string, GameRoom>());
    this.emitter = (globalThis.__gameRoomEmitter ??= Object.assign(new EventEmitter(), {}));
    this.emitter.setMaxListeners(0);
  }

  async get(pin: string): Promise<GameRoom | undefined> {
    return this.rooms.get(pin);
  }

  async save(room: GameRoom): Promise<void> {
    this.rooms.set(room.pin, room);
  }

  async delete(pin: string): Promise<void> {
    this.rooms.delete(pin);
  }

  async publish(pin: string, view: RoomView): Promise<void> {
    this.emitter.emit(`room:${pin}`, view);
  }

  subscribe(pin: string, cb: (view: RoomView) => void): () => void {
    const handler = (view: RoomView) => cb(view);
    this.emitter.on(`room:${pin}`, handler);
    return () => this.emitter.off(`room:${pin}`, handler);
  }
}

// -------------------------------------------------------------
// 2. UPSTASH / REST REDIS ADAPTER (Edge & Serverless friendly)
// -------------------------------------------------------------
export class UpstashRoomAdapter implements GameRoomAdapter {
  readonly name = "redis-rest";
  private url: string;
  private token: string;
  private memoryFallback: MemoryRoomAdapter;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, "");
    this.token = token;
    this.memoryFallback = new MemoryRoomAdapter();
  }

  private async command(...args: (string | number)[]): Promise<unknown> {
    const res = await fetch(`${this.url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`Upstash error: ${res.statusText}`);
    const data = await res.json();
    return data.result;
  }

  async get(pin: string): Promise<GameRoom | undefined> {
    try {
      const data = await this.command("GET", `dethiso:room:${pin}`);
      if (!data) return undefined;
      return typeof data === "string" ? JSON.parse(data) : (data as GameRoom);
    } catch {
      return this.memoryFallback.get(pin);
    }
  }

  async save(room: GameRoom): Promise<void> {
    await this.memoryFallback.save(room);
    try {
      await this.command("SET", `dethiso:room:${room.pin}`, JSON.stringify(room), "EX", ROOM_TTL_SEC);
    } catch {
      // fallback saved in memory
    }
  }

  async delete(pin: string): Promise<void> {
    await this.memoryFallback.delete(pin);
    try {
      await this.command("DEL", `dethiso:room:${pin}`);
    } catch {
      // ignore
    }
  }

  async publish(pin: string, view: RoomView): Promise<void> {
    await this.memoryFallback.publish(pin, view);
    try {
      await this.command("PUBLISH", `dethiso:channel:${pin}`, JSON.stringify(view));
    } catch {
      // ignore
    }
  }

  subscribe(pin: string, cb: (view: RoomView) => void): () => void {
    return this.memoryFallback.subscribe(pin, cb);
  }
}

// -------------------------------------------------------------
// 3. TCP REDIS ADAPTER (Native Node.js 'net' / 'tls' - 0 deps)
// -------------------------------------------------------------
export class TcpRedisAdapter implements GameRoomAdapter {
  readonly name = "redis-tcp";
  private redisUrl: string;
  private memoryFallback: MemoryRoomAdapter;

  constructor(redisUrl: string) {
    this.redisUrl = redisUrl;
    this.memoryFallback = new MemoryRoomAdapter();
  }

  /** Minimal RESP command execution via native socket */
  private execute(commandArgs: string[]): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        const parsed = new URL(this.redisUrl);
        const isTls = parsed.protocol === "rediss:";
        const port = parseInt(parsed.port, 10) || 6379;
        const host = parsed.hostname || "127.0.0.1";
        const password = parsed.password;

        const socket = isTls
          ? tls.connect({ host, port, rejectUnauthorized: false })
          : net.createConnection({ host, port });

        socket.setTimeout(3000);

        let buffer = "";
        socket.on("data", (chunk) => {
          buffer += chunk.toString("utf-8");
          // Simple RESP termination check
          if (buffer.endsWith("\r\n")) {
            socket.end();
          }
        });

        socket.on("end", () => {
          // Parse RESP bulk string or simple string
          if (buffer.startsWith("$-1")) {
            resolve(null);
          } else if (buffer.startsWith("$")) {
            const lines = buffer.split("\r\n");
            resolve(lines[1] ?? null);
          } else if (buffer.startsWith("+")) {
            resolve(buffer.slice(1).trim());
          } else {
            resolve(buffer.trim());
          }
        });

        socket.on("error", (err) => {
          socket.destroy();
          reject(err);
        });

        socket.on("timeout", () => {
          socket.destroy();
          reject(new Error("Redis socket timeout"));
        });

        socket.on("connect", () => {
          const send = (args: string[]) => {
            const resp = `*${args.length}\r\n` + args.map((a) => `$${Buffer.byteLength(a)}\r\n${a}\r\n`).join("");
            socket.write(resp);
          };

          if (password) {
            send(["AUTH", password]);
          }
          send(commandArgs);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async get(pin: string): Promise<GameRoom | undefined> {
    try {
      const raw = await this.execute(["GET", `dethiso:room:${pin}`]);
      if (!raw) return this.memoryFallback.get(pin);
      return JSON.parse(raw);
    } catch {
      return this.memoryFallback.get(pin);
    }
  }

  async save(room: GameRoom): Promise<void> {
    await this.memoryFallback.save(room);
    try {
      await this.execute(["SET", `dethiso:room:${room.pin}`, JSON.stringify(room), "EX", String(ROOM_TTL_SEC)]);
    } catch {
      // fallback saved in memory
    }
  }

  async delete(pin: string): Promise<void> {
    await this.memoryFallback.delete(pin);
    try {
      await this.execute(["DEL", `dethiso:room:${pin}`]);
    } catch {
      // ignore
    }
  }

  async publish(pin: string, view: RoomView): Promise<void> {
    await this.memoryFallback.publish(pin, view);
    try {
      await this.execute(["PUBLISH", `dethiso:channel:${pin}`, JSON.stringify(view)]);
    } catch {
      // ignore
    }
  }

  subscribe(pin: string, cb: (view: RoomView) => void): () => void {
    return this.memoryFallback.subscribe(pin, cb);
  }
}

// -------------------------------------------------------------
// 4. FACTORY: AUTO-SELECT ADAPTER BASED ON ENVIRONMENT
// -------------------------------------------------------------
declare global {
  var __gameRoomAdapter: GameRoomAdapter | undefined;
}

export function getGameRoomAdapter(): GameRoomAdapter {
  if (globalThis.__gameRoomAdapter) return globalThis.__gameRoomAdapter;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    return (globalThis.__gameRoomAdapter = new UpstashRoomAdapter(upstashUrl, upstashToken));
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return (globalThis.__gameRoomAdapter = new TcpRedisAdapter(redisUrl));
  }

  return (globalThis.__gameRoomAdapter = new MemoryRoomAdapter());
}
