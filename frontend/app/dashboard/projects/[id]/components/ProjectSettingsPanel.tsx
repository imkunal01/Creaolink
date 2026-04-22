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

const STATUS_DOT: Record<string, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  offline: "bg-slate-500",
};

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
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
    if (trimmed.length < 3) return "Project name must be at least 3 characters";
    if (trimmed.length > 80) return "Project name must be 80 characters or fewer";
    return "";
  }, [nameInput]);

  const fetchTeam = async () => {
    try {
      setLoadingTeam(true);
      const data = await apiGetTeamMembers(projectId);
      setTeam(data.members);
    } catch {
      // ignore for now
    } finally {
      setLoadingTeam(false);
    }
  };

  const fetchPresence = async () => {
    try {
      setLoadingPresence(true);
      const data = await apiGetFreelancerPresence(projectId);
      setPresence(data.activeFreelancers);
    } catch {
      // ignore for now
    } finally {
      setLoadingPresence(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchPresence();
    const timer = setInterval(fetchPresence, 15000);
    return () => clearInterval(timer);
  }, [projectId]);

  const handleRename = async () => {
    if (nameError || !canManage) return;
    try {
      setSaving(true);
      setMessage("");
      await apiUpdateProjectSettings(projectId, {
        title: nameInput.trim(),
        visibility,
      });
      setMessage("Project settings updated.");
      await onProjectUpdated();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFreelancer = async () => {
    if (!identifier.trim() || !canManage) return;
    try {
      setAddingMember(true);
      setMessage("");
      await apiAddFreelancer(projectId, {
        identifier: identifier.trim(),
        permission,
      });
      setIdentifier("");
      await fetchTeam();
      await onProjectUpdated();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to add freelancer");
    } finally {
      setAddingMember(false);
    }
  };

  const handlePermissionChange = async (targetUserId: string, next: ProjectPermission) => {
    if (!canManage) return;
    try {
      await apiUpdateFreelancerPermission(projectId, {
        userId: targetUserId,
        permission: next,
      });
      await fetchTeam();
      await onProjectUpdated();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update permission");
    }
  };

  const handleRemoveFreelancer = async (targetUserId: string) => {
    if (!canManage) return;
    const confirmed = window.confirm("Remove this freelancer from the project?");
    if (!confirmed) return;

    try {
      await apiRemoveFreelancer(projectId, { userId: targetUserId });
      await fetchTeam();
      await onProjectUpdated();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to remove freelancer");
    }
  };

  const handleUpdatePresence = async () => {
    if (!user) return;
    try {
      await apiUpdateFreelancerPresence(projectId, {
        status: myStatus,
        currentTask: myTask,
        hoursLogged: myHours,
      });
      await fetchPresence();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update live status");
    }
  };

  const handleDeleteProject = async () => {
    if (!canManage) return;
    if (deletePhrase.trim().toLowerCase() !== project.title.trim().toLowerCase()) {
      setMessage("Type the exact project name before deleting.");
      return;
    }

    try {
      setDeleting(true);
      await apiDeleteProject(projectId);
      router.push("/dashboard/projects");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeletePhrase("");
    }
  };

  return (
    <aside className="space-y-5">
      <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c9d1d9]">Project Settings</h2>
        <p className="mt-2 text-xs text-[#8b949e]">Manage name, visibility, and team access in one place.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-[#8b949e]">Rename Project</label>
            <input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              className={`mt-1 w-full rounded-md border bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc] outline-none ${
                nameError ? "border-red-500/60" : "border-[#30363d]"
              }`}
              disabled={!canManage}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#6e7681]">
              <span>{nameError || "Looks good"}</span>
              <span>{nameInput.trim().length}/80</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8b949e]">Visibility</label>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as ProjectVisibility)}
              className="mt-1 w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc]"
              disabled={!canManage}
            >
              <option value="private">Private</option>
              <option value="followers-only">Followers Only</option>
              <option value="public">Public</option>
            </select>
          </div>

          <button
            onClick={handleRename}
            disabled={saving || !!nameError || !canManage}
            className="w-full rounded-md border border-[#1f6feb] bg-[#1f6feb] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Project Settings"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c9d1d9]">Project Metadata</h3>
        <div className="mt-3 space-y-2 text-sm text-[#c9d1d9]">
          <p className="flex items-center justify-between"><span className="text-[#8b949e]">Created</span><span>{formatDate(project.created_at)}</span></p>
          <p className="flex items-center justify-between"><span className="text-[#8b949e]">Last modified</span><span>{formatDate(project.updated_at)}</span></p>
          <p className="flex items-center justify-between"><span className="text-[#8b949e]">Owner</span><span>{project.owner?.name || "Unknown"}</span></p>
        </div>
      </div>

      <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c9d1d9]">Manage Freelancers</h3>
        <div className="mt-3 flex gap-2">
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="username or email"
            className="flex-1 rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc]"
            disabled={!canManage}
          />
          <select
            value={permission}
            onChange={(event) => setPermission(event.target.value as ProjectPermission)}
            className="rounded-md border border-[#30363d] bg-[#0d1117] px-2 py-2 text-sm text-[#f0f6fc]"
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
          className="mt-2 w-full rounded-md border border-[#238636] bg-[#238636] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {addingMember ? "Adding..." : "Add Freelancer"}
        </button>

        <div className="mt-3 space-y-2">
          {loadingTeam ? (
            <p className="text-xs text-[#8b949e]">Loading team...</p>
          ) : (
            team.map((member) => (
              <div key={member.id} className="rounded-md border border-[#30363d] bg-[#0d1117] p-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-[#f0f6fc]">{member.name}</p>
                    <p className="text-xs text-[#8b949e]">{member.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-700/50 px-2 py-1 text-[11px] uppercase text-[#c9d1d9]">{member.role}</span>
                </div>

                <div className="mt-2 flex gap-2">
                  <select
                    value={member.permission || "editor"}
                    onChange={(event) => handlePermissionChange(member.id, event.target.value as ProjectPermission)}
                    className="flex-1 rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1.5 text-xs text-[#f0f6fc]"
                    disabled={!canManage}
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  {member.id !== project.created_by && (
                    <button
                      onClick={() => handleRemoveFreelancer(member.id)}
                      className="rounded-md border border-red-600/70 px-2 py-1.5 text-xs text-red-300"
                      disabled={!canManage}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c9d1d9]">Active Freelancers</h3>

        <div className="mt-3 space-y-2">
          {loadingPresence ? (
            <p className="text-xs text-[#8b949e]">Syncing live status...</p>
          ) : presence.length === 0 ? (
            <p className="text-xs text-[#8b949e]">No active statuses yet.</p>
          ) : (
            presence.map((item) => (
              <div key={item.user_id} className="rounded-md border border-[#30363d] bg-[#0d1117] p-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#f0f6fc]">{item.name}</p>
                  <span className="flex items-center gap-1 text-xs text-[#8b949e]">
                    <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[item.status] || STATUS_DOT.offline}`} />
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#8b949e]">Task: {item.current_task || "No task set"}</p>
                <p className="text-xs text-[#8b949e]">Hours logged: {Number(item.hours_logged || 0).toFixed(1)}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 rounded-md border border-[#30363d] bg-[#0d1117] p-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8b949e]">Update My Status</p>
          <div className="mt-2 space-y-2">
            <select
              value={myStatus}
              onChange={(event) => setMyStatus(event.target.value as "online" | "away" | "offline")}
              className="w-full rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1.5 text-xs text-[#f0f6fc]"
            >
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="offline">Offline</option>
            </select>
            <input
              value={myTask}
              onChange={(event) => setMyTask(event.target.value)}
              className="w-full rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1.5 text-xs text-[#f0f6fc]"
              placeholder="Current task"
            />
            <input
              type="number"
              min={0}
              step={0.1}
              value={myHours}
              onChange={(event) => setMyHours(Number(event.target.value || 0))}
              className="w-full rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1.5 text-xs text-[#f0f6fc]"
              placeholder="Hours logged"
            />
            <button
              onClick={handleUpdatePresence}
              className="w-full rounded-md border border-[#1f6feb] bg-[#1f6feb] px-2 py-1.5 text-xs text-white"
            >
              Sync Live Status
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-800/50 bg-red-500/10 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Delete Project</h3>
        <p className="mt-2 text-xs text-red-100/90">
          Permanently delete this project, including versions, feedback, team members, and linked plugin data.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={!canManage}
          className="mt-3 w-full rounded-md border border-red-500/70 px-3 py-2 text-sm text-red-200 disabled:opacity-60"
        >
          Delete Project
        </button>
      </div>

      {message && (
        <div className="rounded-md border border-[#30363d] bg-[#111827] px-3 py-2 text-xs text-[#9fb3c8]">
          {message}
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-[#111827] p-5">
            <h4 className="text-base font-semibold text-[#f0f6fc]">Confirm permanent deletion</h4>
            <p className="mt-2 text-sm text-[#c9d1d9]">
              This action cannot be undone. Type <span className="font-semibold">{project.title}</span> to confirm.
            </p>
            <input
              value={deletePhrase}
              onChange={(event) => setDeletePhrase(event.target.value)}
              className="mt-3 w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc]"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-md border border-[#30363d] px-3 py-2 text-sm text-[#c9d1d9]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleting || deletePhrase.trim().toLowerCase() !== project.title.trim().toLowerCase()}
                className="flex-1 rounded-md border border-red-500/70 bg-red-500/20 px-3 py-2 text-sm text-red-200 disabled:opacity-60"
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
