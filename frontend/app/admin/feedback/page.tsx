"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

interface FeedbackRow {
  id: string;
  project_id: string;
  version_id: string;
  created_by: string;
  type: string;
  priority: string;
  timestamp: string;
  description: string;
  status: "open" | "resolved";
  created_at: string;
  project_title: string;
  creator_name: string;
  creator_email: string;
  version_name?: string | null;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackRow | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await apiFetch(`/api/admin/feedback?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load feedback");
      }
      const data = await res.json();
      setFeedback(data.feedback || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching feedback");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleToggleStatus = async (item: FeedbackRow) => {
    const nextStatus = item.status === "open" ? "resolved" : "open";
    setActionLoading(item.id);
    try {
      const res = await apiFetch(`/api/admin/feedback/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      setFeedback((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: nextStatus } : f))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Status update error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!deleteTarget) return;
    setActionLoading(`del-${deleteTarget.id}`);
    try {
      const res = await apiFetch(`/api/admin/feedback/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete feedback");
      }
      setFeedback((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-mono font-medium text-amber-400 uppercase tracking-wider">
              Review Markers & Comments
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Feedback Moderation
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cross-project timeline markers, client review notes, and revision items
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
            placeholder="Search feedback notes, projects, authors..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-[#ff2a3d]/50 transition"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-[#ff2a3d]/50 transition"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setPriorityFilter("");
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Feedback Table Card */}
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
                <th className="py-3 px-4 font-semibold uppercase">Feedback Item</th>
                <th className="py-3 px-4 font-semibold uppercase">Project</th>
                <th className="py-3 px-4 font-semibold uppercase">Author</th>
                <th className="py-3 px-4 font-semibold uppercase">Priority</th>
                <th className="py-3 px-4 font-semibold uppercase">Status</th>
                <th className="py-3 px-4 font-semibold uppercase">Created</th>
                <th className="py-3 px-4 font-semibold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-48 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-14 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-14 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-20 bg-white/5 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : feedback.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No feedback items found matching your filters.
                  </td>
                </tr>
              ) : (
                feedback.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div>
                        <div className="font-medium text-white line-clamp-2">{item.description}</div>
                        <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-zinc-500">
                          {item.timestamp && (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                              ⏱ {item.timestamp}
                            </span>
                          )}
                          <span>Type: {item.type}</span>
                          {item.version_name && <span>({item.version_name})</span>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/projects/${item.project_id}`}
                        className="font-semibold text-zinc-300 hover:text-[#ff4b5c] transition-colors truncate max-w-[150px] block"
                      >
                        {item.project_title}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{item.creator_name}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[140px]">
                        {item.creator_email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium capitalize border ${
                          item.priority.toLowerCase() === "high"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : item.priority.toLowerCase() === "medium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono capitalize border ${
                          item.status === "open"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === "open" ? "bg-cyan-400" : "bg-emerald-400"
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={actionLoading === item.id}
                          onClick={() => handleToggleStatus(item)}
                          className={`px-2 py-1 text-xs font-semibold rounded border transition ${
                            item.status === "open"
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                              : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300"
                          }`}
                        >
                          {item.status === "open" ? "Resolve" : "Reopen"}
                        </button>

                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1 rounded text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition"
                          title="Delete abusive / spam feedback"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
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
            <span className="font-mono text-white">{totalPages}</span> ({total} items)
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

      {/* Delete Feedback Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0c0d10] border border-red-500/30 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Feedback Note</h3>
                <p className="text-xs text-zinc-400">Project: {deleteTarget.project_title}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-[#121418] p-3 rounded-lg border border-white/5 italic">
              "{deleteTarget.description}"
            </p>

            <p className="text-[11px] text-zinc-400">
              Permanently remove this review note from the project timeline and bust the project cache.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFeedback}
                disabled={actionLoading === `del-${deleteTarget.id}`}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {actionLoading === `del-${deleteTarget.id}` ? "Deleting..." : "Delete Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
