/**
 * GET /api/health/redis
 *
 * Returns a detailed Redis health report including:
 *   - Connection status and latency
 *   - Redis server version, mode, uptime
 *   - Memory usage (used / peak / max)
 *   - Key count in the `cl:*` namespace
 *   - Cache feature flag state
 *   - Rate limit key count (active limiters)
 *
 * Returns 200 OK if healthy, 503 Service Unavailable if not.
 * Returns 200 with `{ ok: false, configured: false }` if REDIS_URL is not set.
 */

import { NextResponse } from "next/server";
import {
  isRedisHealthy,
  getRedisClient,
  getRedisProvider,
  getRedisHost,
  getUpstashClient,
} from "@/lib/cache";
import { flags } from "@/lib/feature-flags";

function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "(invalid url)";
  }
}

function parseInfoSection(info: string, key: string): string | null {
  const match = info.match(new RegExp(`${key}:(\\S+)`));
  return match ? match[1] : null;
}

export async function GET() {
  const startedAt = Date.now();
  const provider = getRedisProvider();
  const redisHost = getRedisHost();

  // Basic connectivity ping
  const health = await isRedisHealthy();

  const base = {
    ok: health.ok,
    configured: health.configured,
    provider,
    redisHost,
    redisUrl: provider === "upstash" ? process.env.UPSTASH_REDIS_REST_URL : (process.env.REDIS_URL ? redactUrl(process.env.REDIS_URL) : null),
    latencyMs: health.latencyMs,
    checkedAt: new Date().toISOString(),
    flags,
  };

  if (!health.ok) {
    console.error("[Redis Health] ✗ Connection failed", {
      redisHost,
      error: health.error,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        ...base,
        error: health.error ?? "Redis unavailable or not configured",
        server: null,
        memory: null,
        keys: null,
      },
      { status: health.configured ? 503 : 200 }
    );
  }

  // Connection is good — gather richer stats
  let server: Record<string, string | null> = {};
  let memory: Record<string, string | null> = {};
  let keyCount: number | null = null;
  let rateLimitKeyCount: number | null = null;

  if (provider === "upstash") {
    try {
      const upstash = getUpstashClient();
      if (upstash) {
        server = {
          version: "Upstash Serverless",
          mode: "REST (HTTP)",
          provider: "Upstash Redis",
          endpoint: process.env.UPSTASH_REDIS_REST_URL || null,
        };
        memory = {
          status: "Managed by Upstash Serverless",
        };

        const keys = await upstash.keys("cl:*");
        let cacheKeys = 0;
        let rlKeys = 0;
        for (const k of keys) {
          if (k.startsWith("cl:rl:")) rlKeys++;
          else cacheKeys++;
        }
        keyCount = cacheKeys;
        rateLimitKeyCount = rlKeys;
      }
    } catch (err) {
      console.warn("[Redis Health] Upstash stats error:", (err as Error).message);
    }
  } else {
    const redis = await getRedisClient();
    if (redis) {
      try {
        // Redis INFO sections
        const [serverInfo, memInfo] = await Promise.all([
          redis.info("server"),
          redis.info("memory"),
        ]);

        server = {
          version:          parseInfoSection(serverInfo, "redis_version"),
          mode:             parseInfoSection(serverInfo, "redis_mode"),
          os:               parseInfoSection(serverInfo, "os"),
          uptimeSeconds:    parseInfoSection(serverInfo, "uptime_in_seconds"),
          connectedClients: parseInfoSection(serverInfo, "connected_clients"),
          tcpPort:          parseInfoSection(serverInfo, "tcp_port"),
        };

        memory = {
          usedHuman:        parseInfoSection(memInfo, "used_memory_human"),
          usedPeakHuman:    parseInfoSection(memInfo, "used_memory_peak_human"),
          maxMemoryHuman:   parseInfoSection(memInfo, "maxmemory_human"),
          maxMemoryPolicy:  parseInfoSection(memInfo, "maxmemory_policy"),
          memFragRatio:     parseInfoSection(memInfo, "mem_fragmentation_ratio"),
          rssHuman:         parseInfoSection(memInfo, "used_memory_rss_human"),
        };

        // Count application cache keys and rate-limit keys using SCAN
        let cacheKeys = 0;
        let rlKeys = 0;

        for await (const keys of redis.scanIterator({ MATCH: "cl:*", COUNT: 500 })) {
          for (const k of keys) {
            if (k.startsWith("cl:rl:")) rlKeys++;
            else cacheKeys++;
          }
        }

        keyCount = cacheKeys;
        rateLimitKeyCount = rlKeys;
      } catch (err) {
        console.warn("[Redis Health] Could not fetch INFO stats:", (err as Error).message);
      }
    }
  }

  console.info("[Redis Health] ✓ Connection healthy", {
    redisHost,
    latencyMs: health.latencyMs,
    keyCount,
    durationMs: Date.now() - startedAt,
  });

  return NextResponse.json(
    {
      ...base,
      server,
      memory,
      keys: {
        cacheKeys: keyCount,
        rateLimitKeys: rateLimitKeyCount,
        total: keyCount !== null && rateLimitKeyCount !== null
          ? keyCount + rateLimitKeyCount
          : null,
        note: "Counts only cl:* namespace keys managed by this application",
      },
    },
    {
      status: 200,
      headers: {
        // Don't cache this response — always live
        "Cache-Control": "no-store",
        "X-Health-Check-Ms": String(Date.now() - startedAt),
      },
    }
  );
}
