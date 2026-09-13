import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import {
  getUpstashClient,
  getRedisClient,
  getRedisProvider,
  getRedisHost,
  getCircuitBreakerState,
} from "@/lib/cache";
import { getFlagsAsync } from "@/lib/feature-flags";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const provider = getRedisProvider();
    const host = getRedisHost();
    const circuitBreaker = getCircuitBreakerState();
    const flags = await getFlagsAsync();

    let latencyMs = -1;
    let isConnected = false;
    let keyCount = 0;
    let errorMsg: string | null = null;

    const start = Date.now();

    try {
      if (provider === "upstash") {
        const upstash = getUpstashClient();
        if (upstash) {
          const pingRes = await upstash.ping();
          latencyMs = Date.now() - start;
          isConnected = pingRes === "PONG" || Boolean(pingRes);
          const dbsize = await upstash.dbsize().catch(() => 0);
          keyCount = Number(dbsize) || 0;
        }
      } else if (provider === "node-redis") {
        const redis = await getRedisClient();
        if (redis && redis.isOpen) {
          await redis.ping();
          latencyMs = Date.now() - start;
          isConnected = true;
          keyCount = await redis.dbSize().catch(() => 0);
        }
      }
    } catch (pingErr) {
      errorMsg = pingErr instanceof Error ? pingErr.message : String(pingErr);
      isConnected = false;
    }

    return NextResponse.json({
      ok: isConnected,
      configured: provider !== "none",
      provider,
      host,
      latencyMs,
      circuitBreaker,
      flags,
      keyCount,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
