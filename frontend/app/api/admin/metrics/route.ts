import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import {
  getUpstashClient,
  getRedisClient,
  getRedisProvider,
  getRedisHost,
  getCircuitBreakerState,
} from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const db = await getPool();
    const provider = getRedisProvider();
    const redisHost = getRedisHost();
    const circuitBreaker = getCircuitBreakerState();

    // 1. PostgreSQL pool statistics
    const poolStats = {
      totalConnections: db.totalCount,
      idleConnections: db.idleCount,
      waitingClients: db.waitingCount,
      maxConfigured: 10,
    };

    // 2. Database entity counts
    const countsRes = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE COALESCE(status, 'active') = 'active') AS active_users,
        (SELECT COUNT(*)::int FROM users WHERE COALESCE(status, 'active') = 'suspended') AS suspended_users,
        (SELECT COUNT(*)::int FROM projects) AS total_projects,
        (SELECT COUNT(*)::int FROM projects WHERE status = 'active') AS active_projects,
        (SELECT COUNT(*)::int FROM versions) AS total_versions,
        (SELECT COUNT(*)::int FROM feedback) AS total_feedback,
        (SELECT COUNT(*)::int FROM posts) AS total_posts
    `);
    const counts = countsRes.rows[0] || {};

    // 3. 24h Audit log activity breakdown
    const audit24hRes = await db.query(`
      SELECT action, COUNT(*)::int AS count
      FROM admin_audit_log
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY action
      ORDER BY count DESC
    `);
    const auditBreakdown = audit24hRes.rows;
    const totalAuditActions24h = auditBreakdown.reduce((sum, r) => sum + r.count, 0);

    // 4. Redis ping & Presence key scanning
    let redisLatencyMs = -1;
    let redisConnected = false;
    let onlinePresenceCount = 0;

    const start = Date.now();
    try {
      if (provider === "upstash") {
        const upstash = getUpstashClient();
        if (upstash) {
          const pong = await upstash.ping();
          redisLatencyMs = Date.now() - start;
          redisConnected = pong === "PONG" || Boolean(pong);

          // Count presence keys via SCAN
          const keys = await upstash.keys("cl:presence:*").catch(() => []);
          onlinePresenceCount = keys.length;
        }
      } else if (provider === "node-redis") {
        const redis = await getRedisClient();
        if (redis && redis.isOpen) {
          await redis.ping();
          redisLatencyMs = Date.now() - start;
          redisConnected = true;

          let presenceCount = 0;
          for await (const k of redis.scanIterator({ MATCH: "cl:presence:*", COUNT: 50 })) {
            if (k) presenceCount++;
          }
          onlinePresenceCount = presenceCount;
        }
      }
    } catch {
      redisConnected = false;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: {
        pool: poolStats,
        counts,
      },
      cache: {
        connected: redisConnected,
        provider,
        host: redisHost,
        latencyMs: redisLatencyMs,
        circuitBreaker,
        onlinePresenceCount,
      },
      audit: {
        total24h: totalAuditActions24h,
        breakdown: auditBreakdown,
      },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
