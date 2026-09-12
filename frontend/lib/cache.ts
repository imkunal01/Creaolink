/**
 * lib/cache.ts  —  Redis cache layer (production-grade with Upstash REST & TCP Redis support)
 *
 * Strategy & Resilience:
 *  - Primary: Upstash Redis (REST) via `@upstash/redis` when UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN are set.
 *             Serverless-native, HTTP-based, no socket leak, zero TCP connection limits.
 *  - Secondary / Legacy: TCP Redis via `redis` client when REDIS_URL or UPSTASH_REDIS_URL is configured.
 *  - Fallback / Circuit breaker:
 *      If Redis is not configured, unreachable, drops connection, or times out,
 *      all cache operations fail fast and transparently fall back to normal PostgreSQL database queries.
 *  - Distributed stampede protection (SETNX).
 *  - Fail-open rate limiting and safe presence fallback.
 */

import { createClient } from "redis";
import { Redis as UpstashRedis } from "@upstash/redis";

// ── Types ──────────────────────────────────────────────────────────────────────

type NodeRedisClient = ReturnType<typeof createClient>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

// ── Singleton & Circuit Breaker State ──────────────────────────────────────────

const CIRCUIT_BREAKER_COOLDOWN_MS = 20_000; // 20s cooldown before retrying connection
const COMMAND_TIMEOUT_MS = 2_000; // 2.0s max for any cache command
const CONNECT_TIMEOUT_MS = 2_500; // 2.5s max for initial connection

const globalForRedis = globalThis as typeof globalThis & {
  _upstashClient?: UpstashRedis | null;
  _redisClient?: NodeRedisClient;
  _redisClientPromise?: Promise<NodeRedisClient | null>;
  _redisLastFailureTime?: number;
  _redisHasLoggedWarning?: boolean;
};

export function getUpstashClient(): UpstashRedis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token && url.trim().length > 0 && token.trim().length > 0) {
    if (!globalForRedis._upstashClient) {
      globalForRedis._upstashClient = new UpstashRedis({
        url: url.trim(),
        token: token.trim(),
      });
    }
    return globalForRedis._upstashClient;
  }
  return null;
}

function getRedisUrl(): string | null {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  return url && url.trim().length > 0 ? url.trim() : null;
}

export function getRedisProvider(): "upstash" | "node-redis" | "none" {
  if (getUpstashClient() !== null) return "upstash";
  if (getRedisUrl() !== null) return "node-redis";
  return "none";
}

export function getRedisHost(): string {
  const upstash = getUpstashClient();
  if (upstash) {
    try {
      return new URL(process.env.UPSTASH_REDIS_REST_URL!).host;
    } catch {
      return "upstash.io";
    }
  }
  const redisUrl = getRedisUrl();
  if (redisUrl) {
    try {
      return new URL(redisUrl).host;
    } catch {
      return "redis-tcp";
    }
  }
  return "not-configured";
}

/** Utility to race any promise against a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue?: T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (fallbackValue !== undefined) {
        resolve(fallbackValue);
      } else {
        reject(new Error(`Redis operation timed out after ${ms}ms`));
      }
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function recordRedisFailure(err?: unknown) {
  globalForRedis._redisLastFailureTime = Date.now();
  globalForRedis._redisClientPromise = undefined;
  globalForRedis._redisClient = undefined;
  const errMsg = err instanceof Error ? err.message : String(err || "Unknown error");
  console.warn(
    `[Redis] Service unavailable (${errMsg}). Entering ${
      CIRCUIT_BREAKER_COOLDOWN_MS / 1000
    }s cooldown — falling back to PostgreSQL.`
  );
}

/**
 * Returns a connected Node Redis client for TCP connections, or null.
 */
export async function getRedisClient(): Promise<NodeRedisClient | null> {
  // If Upstash is active, return null here as node-redis is bypassed
  if (getUpstashClient()) {
    return null;
  }

  if (globalForRedis._redisClient) {
    if (globalForRedis._redisClient.isOpen) {
      return globalForRedis._redisClient;
    }
    globalForRedis._redisClient = undefined;
  }

  if (globalForRedis._redisClientPromise) {
    return globalForRedis._redisClientPromise;
  }

  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    if (!globalForRedis._redisHasLoggedWarning) {
      globalForRedis._redisHasLoggedWarning = true;
      console.info(
        "[Redis] Not configured. App will serve all requests directly from PostgreSQL."
      );
    }
    return null;
  }

  const lastFailure = globalForRedis._redisLastFailureTime || 0;
  if (Date.now() - lastFailure < CIRCUIT_BREAKER_COOLDOWN_MS) {
    return null;
  }

  let redisHost = "unknown";
  try {
    redisHost = new URL(redisUrl).host;
  } catch {
    redisHost = redisUrl;
  }

  globalForRedis._redisClientPromise = (async () => {
    try {
      const nextClient = createClient({
        url: redisUrl,
        disableOfflineQueue: true,
        socket: {
          connectTimeout: CONNECT_TIMEOUT_MS,
          reconnectStrategy: (retries: number) => {
            if (retries > 3) {
              return new Error("[Redis] Max connection retries reached");
            }
            return Math.min(retries * 250, 2_000);
          },
        },
      });

      nextClient.on("error", (err: any) => {
        console.warn("[Redis] Client socket error:", err?.message || err);
      });

      const t = Date.now();
      await withTimeout(nextClient.connect(), CONNECT_TIMEOUT_MS + 500);

      globalForRedis._redisClient = nextClient;
      globalForRedis._redisLastFailureTime = 0;
      console.info("[Redis] Connected successfully", {
        host: redisHost,
        latencyMs: Date.now() - t,
      });

      return nextClient;
    } catch (err) {
      recordRedisFailure(err);
      return null;
    } finally {
      globalForRedis._redisClientPromise = undefined;
    }
  })();

  return globalForRedis._redisClientPromise;
}

// ── Key building ───────────────────────────────────────────────────────────────

type Primitive = string | number | boolean;

function normalizePart(part: Primitive): string {
  return String(part).trim().replace(/\s+/g, "-").toLowerCase();
}

export function buildCacheKey(...parts: Primitive[]): string {
  const normalized = parts.filter((p) => p !== "").map(normalizePart);
  return ["cl", ...normalized].join(":");
}

// ── Core GET / SET / DEL ──────────────────────────────────────────────────────

export async function getCachedJson<T>(key: string): Promise<T | null> {
  try {
    const upstash = getUpstashClient();
    if (upstash) {
      const data = await withTimeout(upstash.get<T>(key), COMMAND_TIMEOUT_MS, null);
      if (data === null || data === undefined) return null;
      if (typeof data === "string") {
        try {
          return JSON.parse(data) as T;
        } catch {
          return data as unknown as T;
        }
      }
      return data as T;
    }

    const redis = await getRedisClient();
    if (!redis || !redis.isOpen) return null;

    const value = await withTimeout(redis.get(key), COMMAND_TIMEOUT_MS, null);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.warn("[Redis] GET failed, bypassing cache:", {
      key,
      err: (err as Error).message,
    });
    return null;
  }
}

export async function setCachedJson<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> {
  try {
    const upstash = getUpstashClient();
    if (upstash) {
      await withTimeout(upstash.set(key, value, { ex: ttlSeconds }), COMMAND_TIMEOUT_MS);
      return true;
    }

    const redis = await getRedisClient();
    if (!redis || !redis.isOpen) return false;

    const serialized = JSON.stringify(value);
    await withTimeout(redis.set(key, serialized, { EX: ttlSeconds }), COMMAND_TIMEOUT_MS);
    return true;
  } catch (err) {
    console.warn("[Redis] SET failed, continuing without cache:", {
      key,
      err: (err as Error).message,
    });
    return false;
  }
}

export async function deleteCachedKeys(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  try {
    const upstash = getUpstashClient();
    if (upstash) {
      return await withTimeout(upstash.del(...keys), COMMAND_TIMEOUT_MS, 0);
    }

    const redis = await getRedisClient();
    if (!redis || !redis.isOpen) return 0;

    return await withTimeout(redis.del(keys), COMMAND_TIMEOUT_MS, 0);
  } catch (err) {
    console.warn("[Redis] DEL failed:", {
      keys,
      err: (err as Error).message,
    });
    return 0;
  }
}

export async function deleteCachedPattern(pattern: string): Promise<number> {
  try {
    const upstash = getUpstashClient();
    if (upstash) {
      const keys = await withTimeout(upstash.keys(pattern), COMMAND_TIMEOUT_MS, []);
      if (keys && keys.length > 0) {
        return await withTimeout(upstash.del(...keys), COMMAND_TIMEOUT_MS, 0);
      }
      return 0;
    }

    const redis = await getRedisClient();
    if (!redis || !redis.isOpen) return 0;

    let deleted = 0;
    for await (const keys of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      if (keys.length > 0) {
        deleted += (await withTimeout(redis.del(keys), COMMAND_TIMEOUT_MS, 0)) ?? 0;
      }
    }
    return deleted;
  } catch (err) {
    console.warn("[Redis] Pattern DEL failed:", {
      pattern,
      err: (err as Error).message,
    });
    return 0;
  }
}

// ── Read-through cache with Automatic Database Fallback ───────────────────────

export async function readThroughCache<T>(params: {
  key: string;
  ttlSeconds: number;
  source: string;
  compute: () => Promise<T>;
}): Promise<T> {
  const t = Date.now();

  // 1. Try Cache GET (fast path)
  try {
    const cached = await getCachedJson<T>(params.key);
    if (cached !== null) {
      return cached;
    }
  } catch (err) {
    console.warn(`[Cache] GET failed for ${params.key}, falling back to DB:`, (err as Error).message);
  }

  // 2. Distributed stampede protection via Redis lock
  let lockAcquired = false;
  const lockKey = `${params.key}:lock`;

  try {
    const upstash = getUpstashClient();
    if (upstash) {
      const lockRes = await withTimeout(
        upstash.set(lockKey, "1", { nx: true, ex: 5 }),
        500,
        null
      );
      lockAcquired = lockRes === "OK" || Boolean(lockRes);
      if (!lockAcquired) {
        await new Promise((r) => setTimeout(r, 150));
        const retried = await getCachedJson<T>(params.key);
        if (retried !== null) return retried;
      }
    } else {
      const redis = await getRedisClient();
      if (redis && redis.isOpen) {
        const lockRes = await withTimeout(
          redis.set(lockKey, "1", { NX: true, EX: 5 }),
          500,
          null
        );
        lockAcquired = Boolean(lockRes);

        if (!lockAcquired) {
          await new Promise((r) => setTimeout(r, 150));
          const retried = await getCachedJson<T>(params.key);
          if (retried !== null) return retried;
        }
      }
    }
  } catch {
    lockAcquired = false;
  }

  // 3. Cache miss or Redis down → execute DB query
  const computed = await params.compute();

  // 4. Save to Redis in background / safely
  try {
    await setCachedJson(params.key, computed, params.ttlSeconds);
    console.info("[Cache] DB→SET", {
      source: params.source,
      key: params.key,
      ttlSeconds: params.ttlSeconds,
      durationMs: Date.now() - t,
    });
  } catch {
    // Ignore cache set failures
  } finally {
    if (lockAcquired) {
      try {
        const upstash = getUpstashClient();
        if (upstash) {
          await withTimeout(upstash.del(lockKey), 500, 0).catch(() => {});
        } else {
          const redis = await getRedisClient();
          if (redis && redis.isOpen) {
            await withTimeout(redis.del(lockKey), 500, 0).catch(() => {});
          }
        }
      } catch {
        // Ignore lock release error
      }
    }
  }

  return computed;
}

// ── Rate limiting (sliding window, fail-open) ──────────────────────────────────

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  try {
    const key = `cl:rl:${identifier}`;
    const upstash = getUpstashClient();

    if (upstash) {
      const count = await withTimeout(upstash.incr(key), COMMAND_TIMEOUT_MS, 1);
      if (count === 1) {
        await withTimeout(upstash.expire(key, windowSec), COMMAND_TIMEOUT_MS).catch(() => {});
      }
      const ttl = await withTimeout(upstash.ttl(key), COMMAND_TIMEOUT_MS, windowSec);
      const remaining = Math.max(0, limit - count);
      return {
        allowed: count <= limit,
        remaining,
        resetInSeconds: ttl > 0 ? ttl : windowSec,
      };
    }

    const redis = await getRedisClient();
    if (!redis || !redis.isOpen) {
      return { allowed: true, remaining: limit, resetInSeconds: windowSec };
    }

    const count = await withTimeout(redis.incr(key), COMMAND_TIMEOUT_MS);
    if (count === 1) {
      await withTimeout(redis.expire(key, windowSec), COMMAND_TIMEOUT_MS).catch(() => {});
    }
    const ttl = await withTimeout(redis.ttl(key), COMMAND_TIMEOUT_MS, windowSec);
    const remaining = Math.max(0, limit - count);

    return {
      allowed: count <= limit,
      remaining,
      resetInSeconds: ttl > 0 ? ttl : windowSec,
    };
  } catch {
    return { allowed: true, remaining: limit, resetInSeconds: windowSec };
  }
}

// ── Real-time presence (Redis live store with PostgreSQL fallback) ────────────

const PRESENCE_PREFIX = "cl:presence";
const PRESENCE_TTL = 70; // seconds

export interface PresenceEntry {
  userId: string;
  name: string;
  status: "online" | "away" | "offline";
  currentTask: string;
  hoursLogged: number;
  lastSeen: string; // ISO
}

export async function setPresence(
  projectId: string,
  entry: PresenceEntry
): Promise<void> {
  try {
    const key = `${PRESENCE_PREFIX}:${projectId}:${entry.userId}`;
    const upstash = getUpstashClient();
    if (upstash) {
      await withTimeout(
        upstash.set(key, entry, { ex: PRESENCE_TTL }),
        COMMAND_TIMEOUT_MS
      );
      return;
    }

    const redis = await getRedisClient();
    if (!redis || !redis.isOpen) return;

    await withTimeout(
      redis.set(key, JSON.stringify(entry), { EX: PRESENCE_TTL }),
      COMMAND_TIMEOUT_MS
    );
  } catch {
    // Fail silently — route will write to PostgreSQL fallback
  }
}

export async function getPresence(projectId: string): Promise<PresenceEntry[]> {
  try {
    const pattern = `${PRESENCE_PREFIX}:${projectId}:*`;
    const upstash = getUpstashClient();

    if (upstash) {
      const keys = await withTimeout(upstash.keys(pattern), COMMAND_TIMEOUT_MS, []);
      if (!keys || keys.length === 0) return [];
      const values = await withTimeout(upstash.mget<(PresenceEntry | string)[]>(...keys), COMMAND_TIMEOUT_MS, []);
      const entries: PresenceEntry[] = [];
      for (const v of values) {
        if (v) {
          if (typeof v === "string") {
            try {
              entries.push(JSON.parse(v) as PresenceEntry);
            } catch {}
          } else {
            entries.push(v as PresenceEntry);
          }
        }
      }
      return entries;
    }

    const redis = await getRedisClient();
    if (!redis || !redis.isOpen) return [];

    const entries: PresenceEntry[] = [];
    for await (const keys of redis.scanIterator({ MATCH: pattern, COUNT: 50 })) {
      if (keys.length > 0) {
        const values = await withTimeout(redis.mGet(keys), COMMAND_TIMEOUT_MS, []);
        for (const v of values) {
          if (v) {
            try {
              entries.push(JSON.parse(v) as PresenceEntry);
            } catch {}
          }
        }
      }
    }
    return entries;
  } catch (err) {
    console.warn("[Redis] getPresence failed, falling back to PostgreSQL:", (err as Error).message);
    return [];
  }
}

// ── Cache keys & TTL constants ────────────────────────────────────────────────

export const CHAT_CACHE_TTL = 20;
export function chatKey(projectId: string): string {
  return buildCacheKey("chat", projectId);
}

export async function invalidateChatCache(projectId: string): Promise<void> {
  await deleteCachedKeys([chatKey(projectId)]);
}

export const FEEDBACK_CACHE_TTL = 30;
export function feedbackKey(projectId: string): string {
  return buildCacheKey("feedback", projectId);
}

export async function invalidateFeedbackCache(projectId: string): Promise<void> {
  await deleteCachedKeys([feedbackKey(projectId)]);
}

export const TEAM_CACHE_TTL = 120;
export function teamKey(projectId: string): string {
  return buildCacheKey("team", projectId);
}

export async function invalidateTeamCache(projectId: string): Promise<void> {
  await deleteCachedKeys([teamKey(projectId)]);
}

// ── Health check ───────────────────────────────────────────────────────────────

export async function isRedisHealthy(): Promise<{
  ok: boolean;
  configured: boolean;
  provider: "upstash" | "node-redis" | "none";
  latencyMs: number;
  error?: string;
}> {
  const startedAt = Date.now();
  const upstash = getUpstashClient();

  if (upstash) {
    try {
      const res = await withTimeout(upstash.ping(), 2500);
      if (res === "PONG") {
        return {
          ok: true,
          configured: true,
          provider: "upstash",
          latencyMs: Date.now() - startedAt,
        };
      }
      return {
        ok: false,
        configured: true,
        provider: "upstash",
        latencyMs: Date.now() - startedAt,
        error: `Unexpected ping response: ${res}`,
      };
    } catch (err) {
      return {
        ok: false,
        configured: true,
        provider: "upstash",
        latencyMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    return {
      ok: false,
      configured: false,
      provider: "none",
      latencyMs: 0,
      error: "Redis not configured (UPSTASH_REDIS_REST_URL or REDIS_URL not set)",
    };
  }

  const lastFailure = globalForRedis._redisLastFailureTime || 0;
  if (Date.now() - lastFailure < CIRCUIT_BREAKER_COOLDOWN_MS) {
    return {
      ok: false,
      configured: true,
      provider: "node-redis",
      latencyMs: Date.now() - startedAt,
      error: "Redis connection in cooldown following a previous failure",
    };
  }

  try {
    const redis = await getRedisClient();
    if (!redis || !redis.isOpen) {
      return {
        ok: false,
        configured: true,
        provider: "node-redis",
        latencyMs: Date.now() - startedAt,
        error: "Redis unavailable or failed to connect",
      };
    }

    await withTimeout(redis.ping(), 2000);
    return { ok: true, configured: true, provider: "node-redis", latencyMs: Date.now() - startedAt };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    recordRedisFailure(err);
    return {
      ok: false,
      configured: true,
      provider: "node-redis",
      latencyMs: Date.now() - startedAt,
      error: errorMsg,
    };
  }
}
