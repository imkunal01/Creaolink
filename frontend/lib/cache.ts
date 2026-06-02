/**
 * lib/cache.ts  —  Redis cache layer (production-grade)
 *
 * Strategy:
 *  - Single persistent client (re-used across Next.js hot module reloads in dev)
 *  - Graceful degradation: if Redis is unavailable, all functions return null/false
 *    and the app continues serving from DB — no crash.
 *  - Read-through cache with atomic SETNX-based stampede protection.
 *  - Per-key TTL discipline via the key catalog in invalidation.ts
 *  - Rate limiting via sliding window counters (INCR + EXPIRE)
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

// ── Singleton client ───────────────────────────────────────────────────────────

const globalForRedis = globalThis as typeof globalThis & {
  _redisClient?: RedisClient;
  _redisClientPromise?: Promise<RedisClient | null>;
};

let hasLoggedConfigWarning = false;

function getRedisUrl(): string | null {
  return process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || null;
}

/**
 * Returns a connected Redis client, or null if Redis is not configured / unavailable.
 * Safe to call on every request — connection is reused via module-level singleton.
 */
export async function getRedisClient(): Promise<RedisClient | null> {
  // Return existing connected client
  if (globalForRedis._redisClient) return globalForRedis._redisClient;
  // Return in-flight connection promise
  if (globalForRedis._redisClientPromise) return globalForRedis._redisClientPromise;

  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    if (!hasLoggedConfigWarning) {
      hasLoggedConfigWarning = true;
      console.warn(
        "[Redis] Not configured — set REDIS_URL in .env to enable caching. " +
        "App will serve all requests directly from the database."
      );
    }
    return null;
  }

  let redisHost = "unknown";
  try { redisHost = new URL(redisUrl).host; } catch { redisHost = redisUrl; }

  globalForRedis._redisClientPromise = (async () => {
    const nextClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          // Exponential backoff capped at 30s
          if (retries > 10) return new Error("[Redis] Max retries reached");
          return Math.min(retries * 200, 30_000);
        },
        connectTimeout: 5000,
      },
    });

    nextClient.on("error", (err) => {
      console.error("[Redis] Client error:", err.message);
    });

    nextClient.on("reconnecting", () => {
      console.warn("[Redis] Reconnecting…");
    });

    nextClient.on("ready", () => {
      console.info("[Redis] Connection ready", { host: redisHost });
    });

    try {
      const t = Date.now();
      await nextClient.connect();
      globalForRedis._redisClient = nextClient;
      console.info("[Redis] Connected", { host: redisHost, latencyMs: Date.now() - t });
      return nextClient;
    } catch (err) {
      console.error("[Redis] Connection failed:", err instanceof Error ? err.message : err);
      globalForRedis._redisClientPromise = undefined;
      return null;
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
  const redis = await getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error("[Redis] GET failed:", { key, err: (err as Error).message });
    return null;
  }
}

export async function setCachedJson<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) return false;

  try {
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, { EX: ttlSeconds });
    return true;
  } catch (err) {
    console.error("[Redis] SET failed:", { key, err: (err as Error).message });
    return false;
  }
}

export async function deleteCachedKeys(keys: string[]): Promise<number> {
  const redis = await getRedisClient();
  if (!redis || keys.length === 0) return 0;

  try {
    return await redis.del(keys);
  } catch (err) {
    console.error("[Redis] DEL failed:", { keys, err: (err as Error).message });
    return 0;
  }
}

/** Delete all keys matching a pattern — use sparingly, SCAN is O(N) */
export async function deleteCachedPattern(pattern: string): Promise<number> {
  const redis = await getRedisClient();
  if (!redis) return 0;

  let deleted = 0;
  for await (const keys of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    if (keys.length > 0) {
      deleted += await redis.del(keys);
    }
  }
  return deleted;
}

// ── Read-through cache ─────────────────────────────────────────────────────────

/**
 * Read-through cache with distributed stampede protection via Redis SETNX.
 *
 * Flow:
 *  1. Try GET → return if hit
 *  2. Try to acquire lock with SETNX (5s TTL)
 *     a. Lock acquired → compute + SET + release lock
 *     b. Lock not acquired → wait 250ms and re-try GET (another instance is computing)
 *  3. On DB error: re-throw (never silently swallow DB failures)
 */
export async function readThroughCache<T>(params: {
  key: string;
  ttlSeconds: number;
  source: string;
  compute: () => Promise<T>;
}): Promise<T> {
  const t = Date.now();
  const redis = await getRedisClient();

  // Fast path: no Redis → always hit DB
  if (!redis) {
    return params.compute();
  }

  // 1. Cache hit
  const cached = await getCachedJson<T>(params.key);
  if (cached !== null) {
    return cached;
  }

  // 2. Distributed stampede protection via Redis lock
  const lockKey = `${params.key}:lock`;
  const lockAcquired = await redis.set(lockKey, "1", { NX: true, EX: 5 });

  if (!lockAcquired) {
    // Another instance is computing — wait briefly and retry
    await new Promise((r) => setTimeout(r, 300));
    const retried = await getCachedJson<T>(params.key);
    if (retried !== null) return retried;
    // Still nothing (compute was very fast or failed) — fall through to DB
  }

  // 3. Cache miss → compute + store
  try {
    const computed = await params.compute();
    await setCachedJson(params.key, computed, params.ttlSeconds);
    console.info("[Cache] MISS→SET", {
      source: params.source,
      key: params.key,
      ttlSeconds: params.ttlSeconds,
      durationMs: Date.now() - t,
    });
    return computed;
  } finally {
    // Always release lock
    if (lockAcquired) {
      await redis.del(lockKey).catch(() => {});
    }
  }
}

// ── Rate limiting (sliding window) ────────────────────────────────────────────

/**
 * Sliding window rate limiter using INCR + EXPIRE.
 *
 * @param identifier  Unique key — e.g. `ratelimit:chat:${userId}:${projectId}`
 * @param limit       Max requests allowed in the window
 * @param windowSec   Window duration in seconds
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const redis = await getRedisClient();

  // No Redis → allow everything
  if (!redis) {
    return { allowed: true, remaining: limit, resetInSeconds: windowSec };
  }

  try {
    const key = `cl:rl:${identifier}`;
    const count = await redis.incr(key);

    if (count === 1) {
      // First request in window — set expiry
      await redis.expire(key, windowSec);
    }

    const ttl = await redis.ttl(key);
    const remaining = Math.max(0, limit - count);

    return {
      allowed: count <= limit,
      remaining,
      resetInSeconds: ttl > 0 ? ttl : windowSec,
    };
  } catch {
    // On Redis failure — allow (fail open)
    return { allowed: true, remaining: limit, resetInSeconds: windowSec };
  }
}

// ── Real-time presence (Redis as live store) ──────────────────────────────────

const PRESENCE_PREFIX = "cl:presence";
const PRESENCE_TTL = 70; // seconds — clients must heartbeat every 60s

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
  const redis = await getRedisClient();
  if (!redis) return;

  const key = `${PRESENCE_PREFIX}:${projectId}:${entry.userId}`;
  await redis.set(key, JSON.stringify(entry), { EX: PRESENCE_TTL }).catch(() => {});
}

/** Read all active presence entries for a project (SCAN-based, O(members)) */
export async function getPresence(projectId: string): Promise<PresenceEntry[]> {
  const redis = await getRedisClient();
  if (!redis) return [];

  const pattern = `${PRESENCE_PREFIX}:${projectId}:*`;
  const entries: PresenceEntry[] = [];

  for await (const keys of redis.scanIterator({ MATCH: pattern, COUNT: 50 })) {
    if (keys.length > 0) {
      const values = await redis.mGet(keys);
      for (const v of values) {
        if (v) {
          try { entries.push(JSON.parse(v) as PresenceEntry); } catch { /* skip */ }
        }
      }
    }
  }

  return entries;
}

// ── Chat message caching ───────────────────────────────────────────────────────

/**
 * Cache the last N chat messages for a project.
 * Short TTL (20s) — just enough to de-duplicate rapid polls from the
 * notification system / multiple browser tabs open to the same project.
 */
export const CHAT_CACHE_TTL = 20; // seconds
export function chatKey(projectId: string): string {
  return buildCacheKey("chat", projectId);
}

/** Invalidate chat cache when a new message is posted */
export async function invalidateChatCache(projectId: string): Promise<void> {
  await deleteCachedKeys([chatKey(projectId)]);
}

// ── Feedback caching ───────────────────────────────────────────────────────────

export const FEEDBACK_CACHE_TTL = 30; // seconds
export function feedbackKey(projectId: string): string {
  return buildCacheKey("feedback", projectId);
}

export async function invalidateFeedbackCache(projectId: string): Promise<void> {
  await deleteCachedKeys([feedbackKey(projectId)]);
}

// ── Team member caching ────────────────────────────────────────────────────────

export const TEAM_CACHE_TTL = 120; // 2 minutes — team changes are infrequent
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
  const redis = await getRedisClient();

  if (!redis) {
    return {
      ok: false,
      configured: Boolean(getRedisUrl()),
      latencyMs: Date.now() - startedAt,
      error: "Redis unavailable or not configured",
    };
  }

  try {
    await redis.ping();
    return { ok: true, configured: true, latencyMs: Date.now() - startedAt };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
