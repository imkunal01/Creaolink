"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

interface FeatureFlagRow {
  key: string;
  enabled: boolean;
  updated_at: string;
  updated_by: string | null;
  updater_name: string | null;
  updater_email: string | null;
}

interface CacheHealthData {
  ok: boolean;
  configured: boolean;
  provider: string;
  host: string;
  latencyMs: number;
  circuitBreaker: {
    isOpen: boolean;
    cooldownRemainingSeconds: number;
    lastFailureTime: number | null;
    cooldownTotalSeconds: number;
  };
  flags: Record<string, boolean>;
  keyCount: number;
  error?: string | null;
  timestamp: string;
}

const QUICK_PATTERNS = [
  { label: "All Cache Keys", pattern: "cl:*" },
  { label: "All Projects", pattern: "cl:project:*" },
  { label: "All Feeds", pattern: "cl:feed:*" },
  { label: "All Profiles", pattern: "cl:profile:*" },
  { label: "All Feedback", pattern: "cl:feedback:*" },
  { label: "All Team Members", pattern: "cl:team:*" },
];

export default function AdminCachePage() {
  const [flagsList, setFlagsList] = useState<FeatureFlagRow[]>([]);
  const [health, setHealth] = useState<CacheHealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);

  // Invalidation state
  const [invalidatePattern, setInvalidatePattern] = useState("cl:*");
  const [invalidating, setInvalidating] = useState(false);
  const [invalidationResult, setInvalidationResult] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/flags");
      if (!res.ok) return;
      const data = await res.json();
      setFlagsList(data.flags || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await apiFetch("/api/admin/cache/health");
      if (!res.ok) return;
      const data = await res.json();
      setHealth(data);
    } catch {
      // ignore
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // 15s auto-poll
    return () => clearInterval(interval);
  }, [fetchFlags, fetchHealth]);

  const handleToggleFlag = async (flag: FeatureFlagRow) => {
    const nextState = !flag.enabled;
    setTogglingFlag(flag.key);
    try {
      const res = await apiFetch("/api/admin/flags", {
        method: "PATCH",
        body: JSON.stringify({ key: flag.key, enabled: nextState }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle flag");
      }
      setFlagsList((prev) =>
        prev.map((f) => (f.key === flag.key ? { ...f, enabled: nextState } : f))
      );
      fetchHealth();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error toggling flag");
    } finally {
      setTogglingFlag(null);
    }
  };

  const handleManualInvalidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invalidatePattern.trim()) return;
    setInvalidating(true);
    setInvalidationResult(null);
    try {
      const res = await apiFetch("/api/admin/cache/invalidate", {
        method: "POST",
        body: JSON.stringify({ pattern: invalidatePattern.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalidation failed");
      }
      setInvalidationResult(data.message || `Successfully evicted keys matching ${data.pattern}`);
      fetchHealth();
    } catch (err) {
      setInvalidationResult(`Error: ${err instanceof Error ? err.message : "Eviction failed"}`);
    } finally {
      setInvalidating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">
            High-Performance Caching Tier
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
          Cache & Feature Flag Control
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Live DB-backed cache toggles, circuit breaker monitoring, and incident key eviction
        </p>
      </div>

      {/* Section 1: Feature Flags */}
      <div className="p-6 rounded-2xl bg-[#0c0d10] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h2 className="text-sm font-bold text-white">Runtime Feature Flags (DB-Backed)</h2>
            <p className="text-xs text-zinc-400">
              Toggled live without redeployment. In-process cache invalidates across requests.
            </p>
          </div>
          <button
            onClick={fetchFlags}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {flagsList.map((flag) => {
            const isToggling = togglingFlag === flag.key;
            return (
              <div
                key={flag.key}
                className="p-4 rounded-xl bg-[#121418] border border-white/[0.06] flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs font-bold text-white">
                      {flag.key}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {flag.key === "cacheFeed" && "Community & home feeds"}
                      {flag.key === "cacheProfile" && "User profile blobs"}
                      {flag.key === "cacheProject" && "Project details & lists"}
                    </div>
                  </div>

                  <button
                    disabled={isToggling}
                    onClick={() => handleToggleFlag(flag)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      flag.enabled ? "bg-[#ff2a3d]" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        flag.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-2 border-t border-white/[0.04] text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                  <span>
                    State:{" "}
                    <strong className={flag.enabled ? "text-emerald-400" : "text-amber-400"}>
                      {flag.enabled ? "ENABLED" : "BYPASSED"}
                    </strong>
                  </span>
                  {flag.updater_name && <span>By {flag.updater_name}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Health Card & Circuit Breaker */}
      <div className="p-6 rounded-2xl bg-[#0c0d10] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h2 className="text-sm font-bold text-white">Redis Infrastructure & Circuit Breaker</h2>
            <p className="text-xs text-zinc-400">
              Low-latency read-through tier health with automatic fail-open PostgreSQL fallback
            </p>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loadingHealth}
            className="px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1"
          >
            {loadingHealth ? "Checking..." : "Ping Redis"}
          </button>
        </div>

        {health ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.06] space-y-1">
              <div className="text-[11px] font-mono text-zinc-500 uppercase">Redis Status</div>
              <div className="flex items-center gap-2 pt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    health.ok ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                  }`}
                />
                <span className="font-semibold text-sm text-white">
                  {health.ok ? "Connected" : "Unreachable"}
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-500 truncate">{health.host}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.06] space-y-1">
              <div className="text-[11px] font-mono text-zinc-500 uppercase">Ping Latency</div>
              <div className="font-mono text-xl font-bold text-white pt-0.5">
                {health.latencyMs >= 0 ? `${health.latencyMs} ms` : "—"}
              </div>
              <div className="text-[10px] text-zinc-500 capitalize">{health.provider} REST</div>
            </div>

            <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.06] space-y-1">
              <div className="text-[11px] font-mono text-zinc-500 uppercase">Circuit Breaker</div>
              <div className="pt-1">
                {health.circuitBreaker.isOpen ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    OPEN ({health.circuitBreaker.cooldownRemainingSeconds}s cooldown)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    CLOSED (Healthy)
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-500">20s fail-safe cooldown</div>
            </div>

            <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.06] space-y-1">
              <div className="text-[11px] font-mono text-zinc-500 uppercase">Active Cache Keys</div>
              <div className="font-mono text-xl font-bold text-white pt-0.5">
                {health.keyCount}
              </div>
              <div className="text-[10px] text-zinc-500">Namespace: cl:*</div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500">Loading Redis telemetry...</div>
        )}
      </div>

      {/* Section 3: Manual Cache Invalidation */}
      <div className="p-6 rounded-2xl bg-[#0c0d10] border border-white/[0.08] space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white">Emergency Key Eviction (Incident Response)</h2>
          <p className="text-xs text-zinc-400">
            Evict cached entries using Redis SCAN + DEL. Use wildcard patterns to bust stale cache layers safely.
          </p>
        </div>

        {/* Quick Pattern Buttons */}
        <div className="flex flex-wrap gap-2">
          {QUICK_PATTERNS.map((item) => (
            <button
              key={item.pattern}
              type="button"
              onClick={() => setInvalidatePattern(item.pattern)}
              className="px-2.5 py-1 rounded bg-[#121418] hover:bg-[#181b20] border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition"
            >
              {item.label} (<span className="text-[#ff4b5c]">{item.pattern}</span>)
            </button>
          ))}
        </div>

        {/* Invalidation Form */}
        <form onSubmit={handleManualInvalidation} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={invalidatePattern}
            onChange={(e) => setInvalidatePattern(e.target.value)}
            placeholder="cl:project:*"
            className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#121418] border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff2a3d]/50"
          />
          <button
            type="submit"
            disabled={invalidating}
            className="px-4 py-2.5 rounded-lg bg-[#ff2a3d] hover:bg-[#ff4b5c] disabled:opacity-50 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 shrink-0"
          >
            {invalidating ? "Evicting..." : "Evict Matching Keys"}
          </button>
        </form>

        {invalidationResult && (
          <div
            className={`p-3 rounded-lg text-xs font-mono border ${
              invalidationResult.startsWith("Error")
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {invalidationResult}
          </div>
        )}
      </div>
    </div>
  );
}
