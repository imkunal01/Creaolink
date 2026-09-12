"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/auth";
import {
  apiAddFreelancer,
  apiDeleteProject,
  apiGetFreelancerPresence,
  apiGetTeamMembers,
  apiRemoveFreelancer,
  apiUpdateFreelancerPermission,
  apiUpdateFreelancerPresence,
  apiUpdateProjectSettings,
  type ActiveFreelancer,
  type ProjectDetails,
  type ProjectPermission,
  type ProjectVisibility,
} from "@/lib/api";

interface ProjectSettingsPanelProps {
  projectId: string;
  project: ProjectDetails;
  user: User | null;
  onProjectUpdated: () => Promise<void>;
}

const STATUS_COLORS: Record<string, string> = {
  online: "#10b981",
  away: "#f59e0b",
  offline: "#71717a",
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

export default function ProjectSettingsPanel({
  projectId,
  project,
  user,
  onProjectUpdated,
}: ProjectSettingsPanelProps) {
  const router = useRouter();
  const [nameInput, setNameInput] = useState(project.title);
  const [visibility, setVisibility] = useState<ProjectVisibility>(project.visibility);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "err">("ok");

  const [team, setTeam] = useState(project.members || []);
  const [presence, setPresence] = useState<ActiveFreelancer[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingPresence, setLoadingPresence] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [permission, setPermission] = useState<ProjectPermission>("editor");
  const [addingMember, setAddingMember] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [myStatus, setMyStatus] = useState<"online" | "away" | "offline">("online");
  const [myTask, setMyTask] = useState("");
  const [myHours, setMyHours] = useState(0);

  useEffect(() => {
    setNameInput(project.title);
    setVisibility(project.visibility);
    setTeam(project.members || []);
  }, [project]);

  const canManage = useMemo(() => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (project.created_by === user.id) return true;
    const me = project.members.find((member) => member.id === user.id);
    return me?.permission === "admin";
  }, [project.created_by, project.members, user]);

  const nameError = useMemo(() => {
    const trimmed = nameInput.trim();
    if (!trimmed) return "Project name is required";
    if (trimmed.length < 3) return "Must be at least 3 characters";
    if (trimmed.length > 80) return "Maximum 80 characters";
    return "";
  }, [nameInput]);

  const fetchTeam = async () => {
    try {
      setLoadingTeam(true);
      const data = await apiGetTeamMembers(projectId);
      setTeam(data.members);
    } catch { /* ignore */ } finally {
      setLoadingTeam(false);
    }
  };

  const fetchPresence = async () => {
    try {
      setLoadingPresence(true);
      const data = await apiGetFreelancerPresence(projectId);
      setPresence(data.activeFreelancers);
    } catch { /* ignore */ } finally {
      setLoadingPresence(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchPresence();
    const timer = setInterval(fetchPresence, 15000);
    return () => clearInterval(timer);
  }, [projectId]);

  const showMsg = (text: string, type: "ok" | "err" = "ok") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleRename = async () => {
    if (!canManage || nameError) return;
    try {
      setSaving(true);
      await apiUpdateProjectSettings(projectId, { title: nameInput.trim(), visibility });
      await onProjectUpdated();
      showMsg("Settings updated successfully.");
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Failed to update settings", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFreelancer = async () => {
    if (!canManage || !identifier.trim()) return;
    try {
      setAddingMember(true);
      await apiAddFreelancer(projectId, { identifier: identifier.trim(), permission });
      setIdentifier("");
      await fetchTeam();
      await onProjectUpdated();
      showMsg("Collaborator added.");
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Failed to add freelancer", "err");
    } finally {
      setAddingMember(false);
    }
  };

  const handlePermissionChange = async (targetUserId: string, nextPerm: ProjectPermission) => {
    if (!canManage) return;
    try {
      await apiUpdateFreelancerPermission(projectId, { userId: targetUserId, permission: nextPerm });
      await fetchTeam();
      await onProjectUpdated();
      showMsg("Permission updated.");
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Failed to update permission", "err");
    }
  };

  const handleRemoveFreelancer = async (targetUserId: string) => {
    if (!canManage) return;
    if (!window.confirm("Remove this collaborator from the workspace?")) return;
    try {
      await apiRemoveFreelancer(projectId, { userId: targetUserId });
      await fetchTeam();
      await onProjectUpdated();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Failed to remove freelancer", "err");
    }
  };

  const handleUpdatePresence = async () => {
    if (!user) return;
    try {
      await apiUpdateFreelancerPresence(projectId, { status: myStatus, currentTask: myTask, hoursLogged: myHours });
      await fetchPresence();
      showMsg("Live status synced.");
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Failed to update live status", "err");
    }
  };

  const handleDeleteProject = async () => {
    if (!canManage) return;
    if (deletePhrase.trim().toLowerCase() !== project.title.trim().toLowerCase()) {
      showMsg("Type the exact project title to confirm deletion.", "err");
      return;
    }
    try {
      setDeleting(true);
      await apiDeleteProject(projectId);
      router.push("/dashboard/projects");
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Failed to delete project", "err");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeletePhrase("");
    }
  };

  return (
    <aside className="space-y-4">
      {/* Feedback Toast */}
      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-mono border ${
            messageType === "err"
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}
        >
          {message}
        </div>
      )}

      {/* Settings Card */}
      <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Room Settings
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Rename Workspace</label>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full h-8 px-2.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-white outline-none focus:border-white/40"
            disabled={!canManage}
          />
          {nameError && <span className="text-[10px] text-red-400 font-mono mt-1 block">{nameError}</span>}
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Visibility Scope</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ProjectVisibility)}
            className="w-full h-8 px-2.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-neutral-300 outline-none [color-scheme:dark]"
            disabled={!canManage}
          >
            <option value="private">Private Workspace</option>
            <option value="followers-only">Team & Followers</option>
            <option value="public">Public Showcase</option>
          </select>
        </div>

        <button
          onClick={handleRename}
          disabled={saving || !!nameError || !canManage}
          className="btn btn-p btn-sm w-full"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Manage Collaborators */}
      <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Manage Team
        </div>

        <div className="flex gap-1.5">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Username or email"
            className="flex-1 h-8 px-2.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-white placeholder:text-neutral-600 outline-none focus:border-white/40"
            disabled={!canManage}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddFreelancer(); }}
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as ProjectPermission)}
            className="w-20 h-8 px-1.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-neutral-300 outline-none [color-scheme:dark]"
            disabled={!canManage}
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <button
          onClick={handleAddFreelancer}
          disabled={!canManage || addingMember || !identifier.trim()}
          className="btn btn-g btn-sm w-full"
        >
          {addingMember ? "Adding..." : "+ Add Collaborator"}
        </button>

        {/* Team list */}
        {loadingTeam ? (
          <div className="text-[11px] font-mono text-neutral-500">Loading team members...</div>
        ) : (
          <div className="space-y-1.5 pt-1">
            {team.map((member) => (
              <div key={member.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white truncate">{member.name}</span>
                  <span className="text-[10px] font-mono uppercase text-neutral-500">{member.role}</span>
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={member.permission || "editor"}
                    onChange={(e) => handlePermissionChange(member.id, e.target.value as ProjectPermission)}
                    className="flex-1 h-6 px-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-neutral-300 outline-none [color-scheme:dark]"
                    disabled={!canManage}
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  {member.id !== project.created_by && (
                    <button
                      onClick={() => handleRemoveFreelancer(member.id)}
                      disabled={!canManage}
                      className="px-2 h-6 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 hover:bg-red-500/20 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Presence */}
      <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Live Presence</span>
          {loadingPresence && <div className="w-3 h-3 rounded-full border border-white/20 border-t-white animate-spin" />}
        </div>

        {presence.length > 0 ? (
          <div className="space-y-1.5">
            {presence.map((item) => (
              <div key={item.user_id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white">{item.name}</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 capitalize">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[item.status] || STATUS_COLORS.offline }}
                    />
                    {item.status}
                  </span>
                </div>
                {item.current_task && (
                  <p className="text-[10px] text-neutral-500 mt-0.5 truncate">
                    Task: {item.current_task}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] font-mono text-neutral-500">No active telemetry logged.</p>
        )}

        {/* Update My Status */}
        <div className="pt-2 border-t border-white/[0.04] space-y-2">
          <div className="text-[10px] font-mono uppercase text-neutral-500">Update My Status</div>
          <select
            value={myStatus}
            onChange={(e) => setMyStatus(e.target.value as "online" | "away" | "offline")}
            className="w-full h-8 px-2 rounded-xl bg-white/[0.03] border border-white/[0.1] text-[11px] text-neutral-300 outline-none [color-scheme:dark]"
          >
            <option value="online">Online / Editing</option>
            <option value="away">Away / In Render</option>
            <option value="offline">Offline / Standby</option>
          </select>
          <input
            value={myTask}
            onChange={(e) => setMyTask(e.target.value)}
            className="w-full h-8 px-2.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-[11px] text-white placeholder:text-neutral-600 outline-none"
            placeholder="Current task focus"
          />
          <div className="flex gap-1.5">
            <input
              type="number"
              min={0}
              step={0.1}
              value={myHours}
              onChange={(e) => setMyHours(Number(e.target.value || 0))}
              className="flex-1 h-8 px-2.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-[11px] text-white placeholder:text-neutral-600 outline-none"
              placeholder="Hours logged"
            />
            <button
              onClick={handleUpdatePresence}
              className="btn btn-p btn-sm px-3"
            >
              Sync
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {canManage && (
        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/[0.03] space-y-2">
          <div className="text-xs font-semibold text-red-400">Danger Zone</div>
          <p className="text-[11px] text-neutral-500 leading-snug">
            Permanently delete this project workspace and all timeline sync data.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            Delete Workspace...
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.14] bg-[#0c0e14]/65 backdrop-blur-md p-6 shadow-2xl space-y-3.5 text-white">
            <h4 className="text-sm font-semibold text-white">Permanent Deletion</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This action cannot be undone. Type{" "}
              <strong className="text-white font-mono">{project.title}</strong> to confirm.
            </p>
            <input
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              placeholder={project.title}
              className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white outline-none focus:border-red-500/60"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePhrase(""); }}
                className="btn btn-g btn-sm flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleting || deletePhrase.trim().toLowerCase() !== project.title.trim().toLowerCase()}
                className="btn btn-danger btn-sm flex-1"
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
