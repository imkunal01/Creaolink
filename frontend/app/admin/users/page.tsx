"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  username: string;
  role: "client" | "freelancer" | "admin";
  status: "active" | "suspended" | "banned";
  avatar_url?: string | null;
  created_at: string;
}

interface ProjectMembership {
  membership_id: string;
  permission: string;
  project_id: string;
  project_title: string;
  project_status: string;
  owner_name: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Action States
  const [actionTarget, setActionTarget] = useState<AdminUserRow | null>(null);
  const [pendingStatus, setPendingStatus] = useState<"active" | "suspended" | "banned" | null>(null);
  const [updating, setUpdating] = useState(false);

  // Membership inspect modal
  const [inspectUser, setInspectUser] = useState<AdminUserRow | null>(null);
  const [memberships, setMemberships] = useState<ProjectMembership[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await apiFetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load users");
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (user: AdminUserRow, newRole: "client" | "freelancer" | "admin") => {
    if (user.role === newRole) return;
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Role update failed");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!actionTarget || !pendingStatus) return;
    setUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/users/${actionTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: pendingStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status update failed");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === actionTarget.id ? { ...u, status: pendingStatus } : u))
      );
      setActionTarget(null);
      setPendingStatus(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const openMembershipModal = async (user: AdminUserRow) => {
    setInspectUser(user);
    setLoadingMemberships(true);
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}/memberships`);
      if (!res.ok) throw new Error("Failed to load memberships");
      const data = await res.json();
      setMemberships(data.memberships || []);
    } catch {
      setMemberships([]);
    } finally {
      setLoadingMemberships(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-mono font-medium text-blue-400 uppercase tracking-wider">
              Directory & Moderation
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            User Management
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Total {total} user accounts registered on Creaolink
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
            placeholder="Search by name, email, username..."
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
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-[#ff2a3d]/50 transition"
          >
            <option value="">All Roles</option>
            <option value="client">Clients</option>
            <option value="freelancer">Freelancers</option>
            <option value="admin">Admins</option>
          </select>

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
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setStatusFilter("");
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Users Table Card */}
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
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">User</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Username</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Role</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Registered</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-20 bg-white/5 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuspended = u.status === "suspended";
                  const isBanned = u.status === "banned";
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#181b20] border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {u.name ? u.name[0].toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-[160px] sm:max-w-[200px]">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate max-w-[160px] sm:max-w-[200px]">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        {u.username ? `@${u.username}` : "—"}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u, e.target.value as "client" | "freelancer" | "admin")
                          }
                          className="px-2 py-1 rounded bg-[#121418] border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-[#ff2a3d]/50 capitalize"
                        >
                          <option value="client">Client</option>
                          <option value="freelancer">Freelancer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                            u.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : isSuspended
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === "active"
                                ? "bg-emerald-400"
                                : isSuspended
                                ? "bg-amber-400"
                                : "bg-red-400"
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openMembershipModal(u)}
                            title="Inspect Project Memberships"
                            className="p-1.5 text-zinc-400 hover:text-white rounded border border-white/5 hover:border-white/15 hover:bg-white/5 transition"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>

                          {u.status === "active" ? (
                            <button
                              onClick={() => {
                                setActionTarget(u);
                                setPendingStatus("suspended");
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded transition"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActionTarget(u);
                                setPendingStatus("active");
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded transition"
                            >
                              Reactivate
                            </button>
                          )}

                          {!isBanned && (
                            <button
                              onClick={() => {
                                setActionTarget(u);
                                setPendingStatus("banned");
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition"
                            >
                              Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#121418]/40 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Page <span className="font-mono text-white">{page}</span> of{" "}
            <span className="font-mono text-white">{totalPages}</span> ({total} records)
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

      {/* Status Confirmation Modal */}
      {actionTarget && pendingStatus && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0c0d10] border border-white/10 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  pendingStatus === "active"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : pendingStatus === "suspended"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white capitalize">
                  Confirm Account {pendingStatus}
                </h3>
                <p className="text-xs text-zinc-400">Target User: {actionTarget.name} ({actionTarget.email})</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-[#121418] p-3 rounded-lg border border-white/5">
              {pendingStatus === "suspended" &&
                "Suspended users will immediately be blocked from logging into the platform until an admin reactivates their account."}
              {pendingStatus === "banned" &&
                "Banned users will permanently be forbidden from logging in or authenticating with Creaolink services."}
              {pendingStatus === "active" &&
                "Reactivating this user will restore full platform access according to their role."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={updating}
                onClick={() => {
                  setActionTarget(null);
                  setPendingStatus(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                disabled={updating}
                onClick={handleConfirmStatusChange}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition ${
                  pendingStatus === "active"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : pendingStatus === "suspended"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {updating ? "Saving..." : `Confirm ${pendingStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memberships Modal */}
      {inspectUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl bg-[#0c0d10] border border-white/10 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Project Memberships
                </h3>
                <p className="text-xs text-zinc-400">
                  {inspectUser.name} ({inspectUser.email})
                </p>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="p-1 text-zinc-400 hover:text-white rounded border border-white/10 hover:bg-white/5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {loadingMemberships ? (
                <div className="py-8 text-center text-xs text-zinc-500">Loading memberships...</div>
              ) : memberships.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  This user is not currently assigned to any projects.
                </div>
              ) : (
                memberships.map((m) => (
                  <div
                    key={m.membership_id}
                    className="p-3 rounded-lg bg-[#121418] border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white text-xs">{m.project_title}</div>
                      <div className="text-[11px] text-zinc-500">Owner: {m.owner_name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize bg-white/5 border border-white/10 text-zinc-300">
                        {m.permission}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        {m.project_status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectUser(null)}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-300 hover:text-white transition"
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
