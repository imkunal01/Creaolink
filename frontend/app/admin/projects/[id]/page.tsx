"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: "active" | "completed" | "approved" | "pending";
  current_version_id: string | null;
  sync_code: string | null;
  visibility: "public" | "private" | "followers-only";
  created_at: string;
  updated_at: string;
  created_by: string;
  owner_name: string;
  owner_email: string;
  owner_username: string;
  version_count: number;
  feedback_count: number;
}

interface MemberRow {
  membership_id: string;
  permission: "admin" | "editor" | "viewer";
  user_id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  user_status: string;
  avatar_url?: string | null;
}

export default function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "active",
    visibility: "private",
    deadline: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Sync Code Regeneration State
  const [regeneratingSync, setRegeneratingSync] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/admin/projects/${projectId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load project details");
      }
      const data = await res.json();
      setProject(data.project);
      setMembers(data.members || []);
      setEditForm({
        title: data.project.title,
        description: data.project.description || "",
        status: data.project.status,
        visibility: data.project.visibility,
        deadline: data.project.deadline || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await apiFetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update project");
      }
      const data = await res.json();
      setProject((prev) => (prev ? { ...prev, ...data.project } : null));
      setShowEditModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving project");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRegenerateSyncCode = async () => {
    if (!confirm("Regenerate Adobe Premiere Pro sync PIN for this project? Any previously linked plugin session will require the new code.")) {
      return;
    }
    setRegeneratingSync(true);
    try {
      const res = await apiFetch(`/api/admin/projects/${projectId}/sync-code`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to regenerate sync code");
      }
      const data = await res.json();
      setProject((prev) => (prev ? { ...prev, sync_code: data.sync_code } : null));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sync code reset error");
    } finally {
      setRegeneratingSync(false);
    }
  };

  const handlePermissionChange = async (userId: string, newPermission: "admin" | "editor" | "viewer") => {
    try {
      const res = await apiFetch(`/api/admin/projects/${projectId}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ permission: newPermission }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change permission");
      }
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, permission: newPermission } : m))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating permission");
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText !== project?.title) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete project");
      }
      router.push("/admin/projects");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete error");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#ff2a3d] border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-400">Loading project oversight data...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 space-y-3">
        <h2 className="text-base font-bold">Project Not Found</h2>
        <p className="text-xs">{error || "The requested project could not be found."}</p>
        <Link href="/admin/projects" className="inline-block px-3 py-1.5 rounded bg-red-500/20 text-xs font-semibold text-white">
          ← Back to Projects List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/admin/projects" className="hover:text-white transition">
              Projects
            </Link>
            <span>/</span>
            <span className="text-zinc-300 font-mono truncate max-w-[200px]">
              {project.id}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {project.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/projects/${projectId}/versions`}
            className="px-3 py-1.5 rounded-lg bg-[#121418] hover:bg-[#181b20] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Timeline Versions ({project.version_count})
          </Link>

          <button
            onClick={() => setShowEditModal(true)}
            className="px-3 py-1.5 rounded-lg bg-[#ff2a3d]/15 hover:bg-[#ff2a3d]/25 border border-[#ff2a3d]/30 text-xs font-semibold text-[#ff4b5c] transition"
          >
            Edit Metadata
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0c0d10] border border-white/[0.08] space-y-1">
          <div className="text-[11px] font-mono text-zinc-500 uppercase">Status</div>
          <div className="flex items-center gap-2 pt-1">
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-semibold capitalize border ${
                project.status === "active"
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                  : project.status === "approved" || project.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c0d10] border border-white/[0.08] space-y-1">
          <div className="text-[11px] font-mono text-zinc-500 uppercase">Sync PIN (Premiere Pro)</div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-sm font-bold text-white tracking-wider">
              {project.sync_code || "None"}
            </span>
            <button
              onClick={handleRegenerateSyncCode}
              disabled={regeneratingSync}
              className="text-[11px] text-zinc-400 hover:text-white underline disabled:opacity-50"
            >
              {regeneratingSync ? "Resetting..." : "Reset PIN"}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c0d10] border border-white/[0.08] space-y-1">
          <div className="text-[11px] font-mono text-zinc-500 uppercase">Project Owner</div>
          <div className="text-xs font-semibold text-white pt-1">{project.owner_name}</div>
          <div className="text-[11px] text-zinc-500 truncate">{project.owner_email}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c0d10] border border-white/[0.08] space-y-1">
          <div className="text-[11px] font-mono text-zinc-500 uppercase">Feedback Markers</div>
          <div className="font-mono text-lg font-bold text-white pt-0.5">{project.feedback_count}</div>
        </div>
      </div>

      {/* Members Section */}
      <div className="p-5 rounded-xl bg-[#0c0d10] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h2 className="text-sm font-bold text-white">Project Members ({members.length})</h2>
            <p className="text-xs text-zinc-400">Manage permissions and team access levels</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#121418]/60 text-zinc-400 font-mono">
                <th className="py-2.5 px-3 font-semibold uppercase">Member</th>
                <th className="py-2.5 px-3 font-semibold uppercase">Platform Role</th>
                <th className="py-2.5 px-3 font-semibold uppercase">Account Status</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-right">Project Permission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {members.map((m) => (
                <tr key={m.membership_id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#181b20] border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {m.name ? m.name[0].toUpperCase() : "M"}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="text-[11px] text-zinc-500">{m.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-zinc-300 capitalize">
                    {m.role}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                        m.user_status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {m.user_status}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <select
                      value={m.permission}
                      onChange={(e) =>
                        handlePermissionChange(m.user_id, e.target.value as "admin" | "editor" | "viewer")
                      }
                      className="px-2 py-1 rounded bg-[#121418] border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-[#ff2a3d]/50 capitalize"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-xl bg-red-500/[0.03] border border-red-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <svg className="text-red-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2 className="text-sm font-bold text-red-400">Danger Zone</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-zinc-400 max-w-xl">
            Cascade delete this project, including all timeline versions, client feedback notes, chat messages, attachments, and membership associations. This action is irreversible.
          </p>
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setShowDeleteModal(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-xs font-semibold text-red-400 hover:text-red-300 transition shrink-0"
          >
            Delete Project
          </button>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateMetadata}
            className="w-full max-w-lg rounded-xl bg-[#0c0d10] border border-white/10 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white">Edit Project Metadata</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-white focus:outline-none focus:border-[#ff2a3d]/50"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-white focus:outline-none focus:border-[#ff2a3d]/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ProjectDetail["status"] })}
                    className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-white focus:outline-none focus:border-[#ff2a3d]/50 capitalize"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Visibility</label>
                  <select
                    value={editForm.visibility}
                    onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value as ProjectDetail["visibility"] })}
                    className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-white focus:outline-none focus:border-[#ff2a3d]/50 capitalize"
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    <option value="followers-only">Followers Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Deadline</label>
                <input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-white focus:outline-none focus:border-[#ff2a3d]/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-3.5 py-1.5 rounded-lg bg-[#ff2a3d] hover:bg-[#ff4b5c] text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cascade Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0c0d10] border border-red-500/30 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Permanently Delete Project</h3>
                <p className="text-xs text-red-400">Cascade Deletion Warning</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-[#121418] p-3 rounded-lg border border-white/5">
              This action will permanently delete <strong className="text-white">{project.title}</strong>, all timeline versions, members, feedback, and chat messages.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400">
                Please type <span className="font-mono font-bold text-white">{project.title}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={project.title}
                className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== project.title || deleting}
                onClick={handleDeleteProject}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold text-white transition"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
