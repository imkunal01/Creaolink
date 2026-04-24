import { NextResponse } from "next/server";
import { isRedisHealthy } from "@/lib/cache";
import { flags } from "@/lib/feature-flags";

export async function GET() {
  const source = "api/health/redis";
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || "";

  const redisHost = (() => {
    try {
      return redisUrl ? new URL(redisUrl).host : "not-configured";
    } catch {
      return "invalid-url";
    }
  })();

  const status = await isRedisHealthy();

  if (!status.ok) {
    console.error("[RedisCheck] Connection failed", {
      source,
      redisHost,
      configured: status.configured,
      durationMs: status.latencyMs,
      message: status.error,
    });

    return NextResponse.json(
      {
        ok: false,
        source,
        redisHost,
        configured: status.configured,
        error: status.error,
        // Phase 6: include feature flag state for quick diagnosis.
        flags,
      },
      { status: 503 }
    );
  }

  console.info("[RedisCheck] Connection successful", {
    source,
    redisHost,
    durationMs: status.latencyMs,
  });

  return NextResponse.json(
    {
      ok: true,
      source,
      redisHost,
      configured: true,
      latencyMs: status.latencyMs,
      // Phase 6: surface active feature flags so operators can verify rollout state.
      flags,
    },
    { status: 200 }
  );
}
