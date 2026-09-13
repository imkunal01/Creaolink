"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

interface MetricsData {
  timestamp: string;
  database: {
    pool: {
      totalConnections: number;
      idleConnections: number;
      waitingClients: number;
      maxConfigured: number;
    };
    counts: {
      total_users: number;
      active_users: number;
      suspended_users: number;
      total_projects: number;
      active_projects: number;
      total_versions: number;
      total_feedback: number;
      total_posts: number;
    };
  };
  cache: {
    connected: boolean;
    provider: string;
    host: string;
    latencyMs: number;
    circuitBreaker: {
      isOpen: boolean;
      cooldownRemainingSeconds: number;
    };
    onlinePresenceCount: number;
  };
  audit: {
    total24h: number;
    breakdown: Array<{ action: string; count: number }>;
  };
}

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/metrics");
      if (!res.ok) return;
      const data = await res.json();
      setMetrics(data);
      setLastRefreshed(new Date());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); // 15s polling
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">
              Real-Time Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            System Metrics & Health
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Live database connection pooling, Redis caching latency, and platform load stats
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-500">
            Updated {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchMetrics}
            className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh Now
          </button>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#ff2a3d] border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-400 font-mono">Aggregating telemetry signals...</p>
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[#0c0d10] border border-white/[0.08] relative overflow-hidden">
              <div className="text-[11px] font-mono text-zinc-500 uppercase">Registered Users</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {metrics.database.counts.total_users}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-mono">
                <span className="text-emerald-400">
                  {metrics.database.counts.active_users} active
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-amber-400">
                  {metrics.database.counts.suspended_users} suspended
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0c0d10] border border-white/[0.08] relative overflow-hidden">
              <div className="text-[11px] font-mono text-zinc-500 uppercase">Active Projects</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {metrics.database.counts.total_projects}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 mt-2">
                {metrics.database.counts.active_projects} in review phase
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0c0d10] border border-white/[0.08] relative overflow-hidden">
              <div className="text-[11px] font-mono text-zinc-500 uppercase">Online Presence</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                {metrics.cache.onlinePresenceCount}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 mt-2">
                Active heartbeats in Redis
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0c0d10] border border-white/[0.08] relative overflow-hidden">
              <div className="text-[11px] font-mono text-zinc-500 uppercase">Synced Timelines</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {metrics.database.counts.total_versions}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 mt-2">
                {metrics.database.counts.total_feedback} feedback markers
              </div>
            </div>
          </div>

          {/* Detailed Telemetry Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PostgreSQL Connection Pool Status */}
            <div className="p-6 rounded-2xl bg-[#0c0d10] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white">PostgreSQL Connection Pool</h2>
                  <p className="text-xs text-zinc-400">
                    Singleton `pg.Pool` connection allocations (Supabase Pooler)
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Max: {metrics.database.pool.maxConfigured}
                </span>
              </div>

              <div className="space-y-4">
                {/* Visual Pool Utilization Bar */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
                    <span>Pool Utilization</span>
                    <span>
                      {metrics.database.pool.totalConnections} /{" "}
                      {metrics.database.pool.maxConfigured} slots used
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (metrics.database.pool.totalConnections /
                            metrics.database.pool.maxConfigured) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-[#121418] border border-white/5">
                    <div className="text-[10px] font-mono text-zinc-500">Allocated</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">
                      {metrics.database.pool.totalConnections}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#121418] border border-white/5">
                    <div className="text-[10px] font-mono text-zinc-500">Idle</div>
                    <div className="text-lg font-bold text-zinc-300 font-mono mt-0.5">
                      {metrics.database.pool.idleConnections}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#121418] border border-white/5">
                    <div className="text-[10px] font-mono text-zinc-500">Queued</div>
                    <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                      {metrics.database.pool.waitingClients}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Redis Caching Health Card */}
            <div className="p-6 rounded-2xl bg-[#0c0d10] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white">Upstash Redis Caching Tier</h2>
                  <p className="text-xs text-zinc-400">
                    Read-through caching latency & circuit breaker state
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold capitalize border ${
                    metrics.cache.connected
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/15 text-red-400 border-red-500/30"
                  }`}
                >
                  {metrics.cache.connected ? "Operational" : "Offline"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-[#121418] border border-white/5 space-y-1">
                  <div className="text-[10px] font-mono text-zinc-500">Roundtrip Latency</div>
                  <div className="text-xl font-bold font-mono text-white">
                    {metrics.cache.latencyMs >= 0 ? `${metrics.cache.latencyMs} ms` : "—"}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#121418] border border-white/5 space-y-1">
                  <div className="text-[10px] font-mono text-zinc-500">Circuit Breaker</div>
                  <div className="text-sm font-bold font-mono pt-1">
                    {metrics.cache.circuitBreaker.isOpen ? (
                      <span className="text-amber-400">
                        OPEN ({metrics.cache.circuitBreaker.cooldownRemainingSeconds}s)
                      </span>
                    ) : (
                      <span className="text-emerald-400">CLOSED (Normal)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#121418] border border-white/5 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                <span>Provider: {metrics.cache.provider} (HTTP REST)</span>
                <span className="truncate max-w-[180px]">{metrics.cache.host}</span>
              </div>
            </div>
          </div>

          {/* 24h Admin Actions Breakdown */}
          <div className="p-6 rounded-2xl bg-[#0c0d10] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Administrative Actions (Last 24 Hours)</h2>
                <p className="text-xs text-zinc-400">
                  Audit events recorded across all operator sessions
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-white">
                Total: {metrics.audit.total24h}
              </span>
            </div>

            {metrics.audit.breakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No administrative mutations recorded in the last 24 hours.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {metrics.audit.breakdown.map((item) => (
                  <div
                    key={item.action}
                    className="p-3 rounded-lg bg-[#121418] border border-white/5 flex items-center justify-between"
                  >
                    <span className="text-xs font-mono text-zinc-300 truncate mr-2">
                      {item.action}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#ff2a3d]/15 text-[#ff4b5c] border border-[#ff2a3d]/30 font-mono text-xs font-bold">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
