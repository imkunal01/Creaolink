"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

interface AuditLogRow {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_name: string | null;
  admin_email: string | null;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Metadata Inspector Modal
  const [inspectRow, setInspectRow] = useState<AuditLogRow | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (actionFilter) params.set("action", actionFilter);
      if (targetTypeFilter) params.set("targetType", targetTypeFilter);
      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await apiFetch(`/api/admin/audit-log?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load audit logs");
      }
      const data = await res.json();
      setLogs(data.auditLog || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching audit logs");
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, targetTypeFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionColor = (action: string) => {
    if (action.startsWith("user.status") || action.startsWith("user.suspend"))
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (action.startsWith("user.role") || action.startsWith("user.session"))
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (action.startsWith("project.delete") || action.startsWith("feedback.delete") || action.startsWith("post.delete"))
      return "bg-red-500/10 text-red-400 border-red-500/20";
    if (action.startsWith("flag.toggle"))
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (action.startsWith("cache."))
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    return "bg-zinc-800 text-zinc-300 border-zinc-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-mono font-medium text-rose-400 uppercase tracking-wider">
              Compliance & Security
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Admin Audit Trail
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Immutable system record of all administrative operations, rollbacks, and moderations
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-[#0c0d10] border border-white/[0.08] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by action, admin, target ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff2a3d]/50 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-[#ff2a3d]/50 transition"
          >
            <option value="">All Actions</option>
            <option value="user.role_change">user.role_change</option>
            <option value="user.status_change">user.status_change</option>
            <option value="project.update">project.update</option>
            <option value="project.delete">project.delete</option>
            <option value="project.version_rollback">project.version_rollback</option>
            <option value="flag.toggle">flag.toggle</option>
            <option value="cache.manual_invalidate">cache.manual_invalidate</option>
            <option value="feedback.delete">feedback.delete</option>
            <option value="post.delete">post.delete</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-[#ff2a3d]/50 transition"
          >
            <option value="">All Target Types</option>
            <option value="user">User</option>
            <option value="project">Project</option>
            <option value="version">Version</option>
            <option value="feature_flag">Feature Flag</option>
            <option value="cache_pattern">Cache Pattern</option>
            <option value="feedback">Feedback</option>
            <option value="post">Post</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setActionFilter("");
              setTargetTypeFilter("");
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl bg-[#0c0d10] border border-white/[0.08] overflow-hidden">
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#121418]/60 text-zinc-400 font-mono">
                <th className="py-3 px-4 font-semibold uppercase">Timestamp</th>
                <th className="py-3 px-4 font-semibold uppercase">Operator</th>
                <th className="py-3 px-4 font-semibold uppercase">Action</th>
                <th className="py-3 px-4 font-semibold uppercase">Target Type</th>
                <th className="py-3 px-4 font-semibold uppercase">Target ID</th>
                <th className="py-3 px-4 font-semibold uppercase text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-white/5 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">
                        {log.admin_name || "System Admin"}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[140px]">
                        {log.admin_email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-300 capitalize">
                      {log.target_type}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px] truncate max-w-[140px]">
                      {log.target_id}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {log.metadata ? (
                        <button
                          onClick={() => setInspectRow(log)}
                          className="px-2.5 py-1 rounded bg-[#121418] hover:bg-[#181b20] border border-white/10 text-zinc-300 hover:text-white transition text-xs font-mono"
                        >
                          JSON
                        </button>
                      ) : (
                        <span className="text-zinc-600 font-mono text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#121418]/40 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Page <span className="font-mono text-white">{page}</span> of{" "}
            <span className="font-mono text-white">{totalPages}</span> ({total} audit events)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2.5 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-white transition"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-white transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Inspector Modal */}
      {inspectRow && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl bg-[#0c0d10] border border-white/10 flex flex-col max-h-[85vh] shadow-2xl">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Audit Event:</span>
                  <span className="font-mono text-[#ff4b5c]">{inspectRow.action}</span>
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  Target: {inspectRow.target_type} ({inspectRow.target_id})
                </p>
              </div>

              <button
                onClick={() => setInspectRow(null)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-[#07080a]">
              <pre className="text-cyan-400 whitespace-pre-wrap selection:bg-cyan-500/20">
                {JSON.stringify(inspectRow.metadata, null, 2)}
              </pre>
            </div>

            <div className="p-3 border-t border-white/[0.08] flex justify-end">
              <button
                onClick={() => setInspectRow(null)}
                className="px-3.5 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
