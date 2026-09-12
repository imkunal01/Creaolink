/**
 * lib/cache.ts  —  Redis cache layer (production-grade with resilient DB fallback)
 *
 * Strategy & Resilience:
 *  - Single persistent client with automatic reconnect & state management.
 *  - Graceful degradation / Circuit breaker:
 *      If Redis is not configured, unreachable, drops connection, or times out,
 *      all cache operations fail fast and transparently fall back to normal PostgreSQL database queries.
 *  - Cooldown circuit breaker:
 *      Prevents connection retries on every single request when Redis is offline,
 *      ensuring zero latency overhead on DB queries when running without Redis.
 *  - Read-through cache with distributed stampede protection (SETNX).
 *  - Fail-open rate limiting and safe presence fallback.
 *
 * Environment variables:
 *   REDIS_URL         — standard redis:// or rediss:// URL (self-hosted / Railway / Render)
 *   UPSTASH_REDIS_URL — alternative for Upstash (same format)
 */

import { createClient } from "redis";

// ── Types ──────────────────────────────────────────────────────────────────────

type RedisClient = ReturnType<typeof createClient>;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

// ── Singleton & Circuit Breaker State ──────────────────────────────────────────

const CIRCUIT_BREAKER_COOLDOWN_MS = 20_000; // 20s cooldown before retrying connection
const COMMAND_TIMEOUT_MS = 1_500; // 1.5s max for any cache command
const CONNECT_TIMEOUT_MS = 2_500; // 2.5s max for initial connection

const globalForRedis = globalThis as typeof globalThis & {
  _redisClient?: RedisClient;
  _redisClientPromise?: Promise<RedisClient | null>;
  _redisLastFailureTime?: number;
  _redisHasLoggedWarning?: boolean;
};

function getRedisUrl(): string | null {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  return url && url.trim().length > 0 ? url.trim() : null;
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
 * Returns a connected and ready Redis client, or null if Redis is not configured,
 * offline, in cooldown, or unreachable.
 *
 * Safe to call on every request — connection is reused and circuit-broken.
 */
export async function getRedisClient(): Promise<RedisClient | null> {
  // If we have an active connected client, verify it's open
  if (globalForRedis._redisClient) {
    if (globalForRedis._redisClient.isOpen) {
      return globalForRedis._redisClient;
    }
    // Client was connected but is no longer open
    globalForRedis._redisClient = undefined;
  }

  // Return in-flight connection promise if currently connecting
  if (globalForRedis._redisClientPromise) {
    return globalForRedis._redisClientPromise;
  }

  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    if (!globalForRedis._redisHasLoggedWarning) {
      globalForRedis._redisHasLoggedWarning = true;
      console.info(
        "[Redis] Not configured (REDIS_URL not set). App will serve all requests directly from PostgreSQL."
      );
    }
    return null;
  }

  // Circuit breaker: check if we're in cooldown after a recent connection failure
  const lastFailure = globalForRedis._redisLastFailureTime || 0;
  const timeSinceFailure = Date.now() - lastFailure;
  if (timeSinceFailure < CIRCUIT_BREAKER_COOLDOWN_MS) {
    // Fast path: bypass Redis immediately without blocking requests
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
        disableOfflineQueue: true, // Fail fast if disconnected instead of queuing indefinitely
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
        // Prevent uncaught error events from crashing the process
        console.warn("[Redis] Client socket error:", err?.message || err);
      });

      nextClient.on("reconnecting", () => {
        console.info("[Redis] Reconnecting…", { host: redisHost });
      });

      nextClient.on("ready", () => {
        console.info("[Redis] Connection ready", { host: redisHost });
      });

      nextClient.on("end", () => {
        globalForRedis._redisClient = undefined;
      });

      const t = Date.now();
      await withTimeout(nextClient.connect(), CONNECT_TIMEOUT_MS + 500);

      globalForRedis._redisClient = nextClient;
      globalForRedis._redisLastFailureTime = 0; // Clear failure time on success
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

/** Delete all keys matching a pattern — use sparingly, SCAN is O(N) */
export async function deleteCachedPattern(pattern: string): Promise<number> {
  try {
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

/**
 * Read-through cache with distributed stampede protection via Redis SETNX.
 *
 * Guarantees:
 *  - 100% resilient fallback: If Redis is unavailable, slow, or errors at any stage,
 *    `params.compute()` (the SQL/DB query) is immediately executed and returned.
 *  - The application will NEVER fail or return a 500 error due to Redis issues.
 *  - If DB query itself fails, that error will throw so caller handles database integrity.
 */
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

  // 2. Distributed stampede protection via Redis lock (only if Redis is active)
  let lockAcquired = false;
  const lockKey = `${params.key}:lock`;

  try {
    const redis = await getRedisClient();
    if (redis && redis.isOpen) {
      const lockRes = await withTimeout(
        redis.set(lockKey, "1", { NX: true, EX: 5 }),
        500,
        null
      );
      lockAcquired = Boolean(lockRes);

      if (!lockAcquired) {
        // Another instance is computing — wait briefly and retry cache
        await new Promise((r) => setTimeout(r, 200));
        const retried = await getCachedJson<T>(params.key);
        if (retried !== null) return retried;
      }
    }
  } catch {
    // If lock attempt fails for any reason, proceed directly to DB compute
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
    // Always release lock safely if acquired
    if (lockAcquired) {
      try {
        const redis = await getRedisClient();
        if (redis && redis.isOpen) {
          await withTimeout(redis.del(lockKey), 500, 0).catch(() => {});
        }
      } catch {
        // Ignore lock release error
      }
    }
  }

  return computed;
}

// ── Rate limiting (sliding window, fail-open) ──────────────────────────────────

/**
 * Sliding window rate limiter using INCR + EXPIRE.
 * Fails open (allows request) if Redis is offline or errors.
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  try {
    const redis = await getRedisClient();

    // No Redis or disconnected → allow everything (fail-open)
    if (!redis || !redis.isOpen) {
      return { allowed: true, remaining: limit, resetInSeconds: windowSec };
    }

    const key = `cl:rl:${identifier}`;
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
    // On Redis failure — fail open
    return { allowed: true, remaining: limit, resetInSeconds: windowSec };
  }
}

// ── Real-time presence (Redis live store with PostgreSQL fallback) ────────────

const PRESENCE_PREFIX = "cl:presence";
const PRESENCE_TTL = 70; // seconds — clients heartbeat every 60s

export interface PresenceEntry {
  userId: string;
  name: string;
  status: "online" | "away" | "offline";
  currentTask: string;
  hoursLogged: number;
  lastSeen: string; // ISO
}

/** Write a user's presence for a project into Redis */
export async function setPresence(
  projectId: string,
  entry: PresenceEntry
): Promise<void> {
  try {
    const redis = await getRedisClient();
    if (!redis || !redis.isOpen) return;

    const key = `${PRESENCE_PREFIX}:${projectId}:${entry.userId}`;
    await withTimeout(
      redis.set(key, JSON.stringify(entry), { EX: PRESENCE_TTL }),
      COMMAND_TIMEOUT_MS
    );
  } catch {
    // Fail silently — route will write to PostgreSQL fallback
  }
}

/** Read all active presence entries for a project */
export async function getPresence(projectId: string): Promise<PresenceEntry[]> {
  try {
    const redis = await getRedisClient();
    if (!redis || !redis.isOpen) return [];

    const pattern = `${PRESENCE_PREFIX}:${projectId}:*`;
    const entries: PresenceEntry[] = [];

    for await (const keys of redis.scanIterator({ MATCH: pattern, COUNT: 50 })) {
      if (keys.length > 0) {
        const values = await withTimeout(redis.mGet(keys), COMMAND_TIMEOUT_MS, []);
        for (const v of values) {
          if (v) {
            try {
              entries.push(JSON.parse(v) as PresenceEntry);
            } catch {
              /* skip */
            }
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

export const CHAT_CACHE_TTL = 20; // seconds
export function chatKey(projectId: string): string {
  return buildCacheKey("chat", projectId);
}

export async function invalidateChatCache(projectId: string): Promise<void> {
  await deleteCachedKeys([chatKey(projectId)]);
}

export const FEEDBACK_CACHE_TTL = 30; // seconds
export function feedbackKey(projectId: string): string {
  return buildCacheKey("feedback", projectId);
}

export async function invalidateFeedbackCache(projectId: string): Promise<void> {
  await deleteCachedKeys([feedbackKey(projectId)]);
}

export const TEAM_CACHE_TTL = 120; // 2 minutes
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
  latencyMs: number;
  error?: string;
}> {
  const startedAt = Date.now();
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    return {
      ok: false,
      configured: false,
      latencyMs: 0,
      error: "Redis not configured (REDIS_URL not set)",
    };
  }

  // Check if currently in cooldown
  const lastFailure = globalForRedis._redisLastFailureTime || 0;
  if (Date.now() - lastFailure < CIRCUIT_BREAKER_COOLDOWN_MS) {
    return {
      ok: false,
      configured: true,
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
        latencyMs: Date.now() - startedAt,
        error: "Redis unavailable or failed to connect",
      };
    }

    await withTimeout(redis.ping(), 2000);
    return { ok: true, configured: true, latencyMs: Date.now() - startedAt };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    recordRedisFailure(err);
    return {
      ok: false,
      configured: true,
      latencyMs: Date.now() - startedAt,
      error: errorMsg,
    };
  }
}

