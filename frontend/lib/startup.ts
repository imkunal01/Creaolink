/**
 * lib/startup.ts — Server startup health checks
 *
 * Called once via instrumentation.ts when the Next.js server process boots.
 * Logs a structured boot banner and Redis connectivity status to stdout so
 * it shows up in your Railway / Render / Vercel logs on every deploy.
 */

import { getRedisClient, isRedisHealthy } from "./cache";

const SEPARATOR = "─".repeat(56);

function logLine(label: string, value: string, ok?: boolean) {
  const icon =
    ok === true ? "✓" : ok === false ? "✗" : "·";
  // Pad label to 22 chars for alignment
  const padded = label.padEnd(22);
  console.log(`  ${icon}  ${padded} ${value}`);
}

function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "(invalid url)";
  }
}

export async function runStartupHealthCheck(): Promise<void> {
  const startedAt = Date.now();

  console.log("");
  console.log(SEPARATOR);
  console.log("  CreaoLink — Server starting");
  console.log(SEPARATOR);

  // ── Environment ────────────────────────────────────────────────────────────
  logLine("Node version", process.version);
  logLine("Environment", process.env.NODE_ENV ?? "development");

  // ── Redis ──────────────────────────────────────────────────────────────────
  const redisUrl =
    process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || "";

  if (!redisUrl) {
    console.log("");
    console.log(
      "  ⚠  REDIS_URL is not set — caching, rate limiting, and presence"
    );
    console.log(
      "     will fall back to PostgreSQL. Set REDIS_URL in .env to enable Redis."
    );
    console.log("");
  } else {
    // Attempt connection and time it
    const health = await isRedisHealthy();
    const redactedUrl = redactUrl(redisUrl);

    console.log("");
    logLine("Redis URL", redactedUrl);

    if (health.ok) {
      logLine("Redis status", `connected (${health.latencyMs}ms)`, true);

      // Pull extra info from Redis INFO command
      try {
        const redis = await getRedisClient();
        if (redis) {
          const info = await redis.info("server");
          const versionMatch = info.match(/redis_version:(\S+)/);
          const modeMatch    = info.match(/redis_mode:(\S+)/);
          const uptimeMatch  = info.match(/uptime_in_seconds:(\d+)/);

          if (versionMatch) logLine("Redis version", versionMatch[1]);
          if (modeMatch)    logLine("Redis mode", modeMatch[1]);
          if (uptimeMatch) {
            const uptimeSec = parseInt(uptimeMatch[1], 10);
            const uptimeStr =
              uptimeSec < 60
                ? `${uptimeSec}s`
                : uptimeSec < 3600
                ? `${Math.floor(uptimeSec / 60)}m ${uptimeSec % 60}s`
                : `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`;
            logLine("Redis uptime", uptimeStr);
          }

          const memInfo = await redis.info("memory");
          const usedMemMatch = memInfo.match(/used_memory_human:(\S+)/);
          if (usedMemMatch) logLine("Redis memory used", usedMemMatch[1]);
        }
      } catch {
        // INFO is optional — don't crash startup if it fails
      }
    } else {
      logLine("Redis status", `FAILED — ${health.error ?? "unknown error"}`, false);
      console.log("");
      console.log(
        "  ⚠  Redis connection failed. The app will serve requests from PostgreSQL."
      );
      console.log(
        "     Verify REDIS_URL is reachable and the server is running."
      );
    }

    console.log("");
  }

  // ── Feature flags ──────────────────────────────────────────────────────────
  const { flags } = await import("./feature-flags");
  logLine("Cache: feed",    flags.cacheFeed    ? "enabled" : "disabled (CACHE_FEED=false)");
  logLine("Cache: profile", flags.cacheProfile ? "enabled" : "disabled (CACHE_PROFILE=false)");
  logLine("Cache: project", flags.cacheProject ? "enabled" : "disabled (CACHE_PROJECT=false)");

  console.log("");
  logLine("Boot time", `${Date.now() - startedAt}ms`);
  console.log(SEPARATOR);
  console.log("");
}
