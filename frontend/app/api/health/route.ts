/**
 * GET /api/health
 *
 * Combined health check — runs Redis ping and DB ping in parallel.
 * Returns 200 only if all critical services are healthy.
 * Returns 503 if any critical service is down.
 *
 * Use this as your uptime monitor / load balancer health probe.
 */

import { NextResponse } from "next/server";
import { isRedisHealthy } from "@/lib/cache";
import { getPool } from "@/lib/db";

export async function GET() {
  const startedAt = Date.now();

  // Run both checks in parallel
  const [redis, db] = await Promise.allSettled([
    isRedisHealthy(),
    (async () => {
      const t = Date.now();
      const pool = await getPool();
      await pool.query("SELECT 1");
      return { ok: true, latencyMs: Date.now() - t };
    })(),
  ]);

  const redisResult =
    redis.status === "fulfilled"
      ? redis.value
      : { ok: false, configured: false, latencyMs: 0, error: String(redis.reason) };

  const dbResult =
    db.status === "fulfilled"
      ? db.value
      : {
          ok: false,
          latencyMs: 0,
          error: db.reason instanceof Error ? db.reason.message : String(db.reason),
        };

  // DB is always critical. Redis is non-critical (app degrades gracefully).
  const allHealthy = dbResult.ok;
  const status = allHealthy ? 200 : 503;

  const body = {
    ok: allHealthy,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    services: {
      database: {
        ok: dbResult.ok,
        latencyMs: dbResult.latencyMs,
        error: "error" in dbResult ? dbResult.error : undefined,
      },
      redis: {
        ok: redisResult.ok,
        configured: redisResult.configured,
        latencyMs: redisResult.latencyMs,
        // Not critical — always reported but doesn't affect overall ok status
        critical: false,
        error: redisResult.error,
      },
    },
  };

  if (!allHealthy) {
    console.error("[Health] ✗ Health check failed", body);
  }

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Health-Check-Ms": String(Date.now() - startedAt),
    },
  });
}
