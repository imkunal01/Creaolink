import { createClient } from "redis";

type Primitive = string | number | boolean;

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let clientPromise: Promise<RedisClient | null> | null = null;
let hasLoggedConfigWarning = false;

// ── Anti-stampede: tracks keys currently being computed ──
const inFlightKeys = new Set<string>();

function getRedisUrl(): string | null {
  return process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || null;
}

function normalizePart(part: Primitive): string {
  return String(part).trim().replace(/\s+/g, "-").toLowerCase();
}

export function buildCacheKey(...parts: Primitive[]): string {
  const normalized = parts.filter((part) => part !== "").map(normalizePart);
  return ["creaolink", ...normalized].join(":");
}

export async function getRedisClient(): Promise<RedisClient | null> {
  if (client) return client;
  if (clientPromise) return clientPromise;

  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    if (!hasLoggedConfigWarning) {
      hasLoggedConfigWarning = true;
      console.warn("[Redis] Disabled: REDIS_URL/UPSTASH_REDIS_URL is not configured.");
    }
    return null;
  }

  clientPromise = (async () => {
    const redisHost = (() => {
      try { return new URL(redisUrl).host; } catch { return redisUrl; }
    })();
    const nextClient = createClient({ url: redisUrl });

    nextClient.on("error", (err) => {
      console.error("[Redis] Client error", {
        message: err instanceof Error ? err.message : String(err),
      });
    });

    try {
      const connectStart = Date.now();
      await nextClient.connect();
      client = nextClient;
      console.info("[Redis] Connected", {
        host: redisHost,
        latencyMs: Date.now() - connectStart,
      });
      return nextClient;
    } catch (err) {
      console.error("[Redis] Connection failed", {
        message: err instanceof Error ? err.message : String(err),
      });
      clientPromise = null;
      return null;
    }
  })();

  return clientPromise;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  const t = Date.now();
  try {
    const value = await redis.get(key);
    console.info("[Redis] GET", {
      key,
      hit: value !== null,
      durationMs: Date.now() - t,
    });
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error("[Redis] GET failed", {
      key,
      durationMs: Date.now() - t,
      message: err instanceof Error ? err.message : String(err),
    });
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

  const t = Date.now();
  const serialized = JSON.stringify(value);
  try {
    await redis.set(key, serialized, { EX: ttlSeconds });
    console.info("[Redis] SET", {
      key,
      ttlSeconds,
      bytes: serialized.length,
      durationMs: Date.now() - t,
    });
    return true;
  } catch (err) {
    console.error("[Redis] SET failed", {
      key,
      ttlSeconds,
      durationMs: Date.now() - t,
      message: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export async function readThroughCache<T>(params: {
  key: string;
  ttlSeconds: number;
  source: string;
  compute: () => Promise<T>;
}): Promise<T> {
  const startedAt = Date.now();
  const cached = await getCachedJson<T>(params.key);
  if (cached !== null) {
    console.info("[Cache] HIT", {
      source: params.source,
      key: params.key,
      durationMs: Date.now() - startedAt,
    });
    return cached;
  }

  // Anti-stampede: if another request is already computing this key, wait once.
  if (inFlightKeys.has(params.key)) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const retry = await getCachedJson<T>(params.key);
    if (retry !== null) {
      console.info("[Cache] HIT (after stampede wait)", {
        source: params.source,
        key: params.key,
        durationMs: Date.now() - startedAt,
      });
      return retry;
    }
  }

  console.info("[Cache] MISS", {
    source: params.source,
    key: params.key,
  });

  inFlightKeys.add(params.key);
  try {
    const computed = await params.compute();
    await setCachedJson(params.key, computed, params.ttlSeconds);

    console.info("[Cache] STORE", {
      source: params.source,
      key: params.key,
      durationMs: Date.now() - startedAt,
      ttlSeconds: params.ttlSeconds,
    });

    return computed;
  } finally {
    inFlightKeys.delete(params.key);
  }
}

export async function deleteCachedKeys(keys: string[]): Promise<number> {
  const redis = await getRedisClient();
  if (!redis || keys.length === 0) return 0;

  const t = Date.now();
  try {
    const deleted = await redis.del(keys);
    console.info("[Redis] DEL", {
      keys,
      deleted,
      durationMs: Date.now() - t,
    });
    return deleted;
  } catch (err) {
    console.error("[Redis] DEL failed", {
      keys,
      durationMs: Date.now() - t,
      message: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

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
    return {
      ok: true,
      configured: true,
      latencyMs: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Per-route timing utility ──
export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const startedAt = Date.now();
  const result = await fn();
  const durationMs = Date.now() - startedAt;
  console.info("[Timing]", { label, durationMs });
  return { result, durationMs };
}
