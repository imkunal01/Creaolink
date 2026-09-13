"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

interface AdminProjectRow {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: "active" | "completed" | "approved" | "pending";
  sync_code: string | null;
  visibility: "public" | "private" | "followers-only";
  created_at: string;
  updated_at: string;
  created_by: string;
  owner_name: string;
  owner_email: string;
  member_count: number;
  version_count: number;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProjectRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await apiFetch(`/api/admin/projects?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load projects");
      }
      const data = await res.json();
      setProjects(data.projects || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching projects");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs font-mono font-medium text-purple-400 uppercase tracking-wider">
              Workspace Oversight
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            System Projects
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Total {total} projects across all creators and organizations
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
            placeholder="Search by title, owner, sync code..."
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
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-xl bg-[#0c0d10] border border-white/[0.08] overflow-hidden">
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#121418]/60 text-zinc-400 font-mono">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Project</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Owner</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Sync Code</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Members</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Versions</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-36 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-12 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-12 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-white/5 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No projects found matching your search criteria.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <Link
                          href={`/admin/projects/${p.id}`}
                          className="font-semibold text-white hover:text-[#ff4b5c] transition-colors truncate max-w-[200px] block"
                        >
                          {p.title}
                        </Link>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[220px]">
                          {p.description || "No description"}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-zinc-300 font-medium">{p.owner_name}</div>
                      <div className="text-[11px] text-zinc-500">{p.owner_email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium capitalize border ${
                          p.status === "active"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            : p.status === "approved" || p.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">
                      {p.sync_code ? (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {p.sync_code}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      {p.member_count}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      {p.version_count}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-[#121418] hover:bg-[#181b20] border border-white/10 rounded transition"
                      >
                        Manage
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
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
            <span className="font-mono text-white">{totalPages}</span> ({total} projects)
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
    </div>
  );
}
