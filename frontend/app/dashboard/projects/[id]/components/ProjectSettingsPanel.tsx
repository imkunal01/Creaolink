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
  online: "#4ade80",
  away: "#fbbf24",
  offline: "var(--m1)",
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

const sectionStyle = {
  background: "var(--s2)",
  border: "1px solid var(--b2)",
  borderRadius: "var(--rl)",
  padding: "1rem 1.1rem",
  marginBottom: "0.85rem",
} as React.CSSProperties;

const labelStyle = {
  display: "block",
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "var(--m1)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  marginBottom: "0.4rem",
};

const inputStyle = {
  width: "100%",
  height: 36,
  padding: "0 10px",
  background: "var(--s3)",
  border: "1px solid var(--b2)",
  borderRadius: "var(--r)",
  fontSize: "0.79rem",
  color: "var(--white)",
  outline: "none",
  fontFamily: "var(--fb)",
} as React.CSSProperties;

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  colorScheme: "dark",
} as React.CSSProperties;

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
    if (nameError || !canManage) return;
    try {
      setSaving(true);
      await apiUpdateProjectSettings(projectId, { title: nameInput.trim(), visibility });
      showMsg("Settings saved.");
      await onProjectUpdated();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Failed to update settings", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFreelancer = async () => {
    if (!identifier.trim() || !canManage) return;
    try {
      setAddingMember(true);
      await apiAddFreelancer(projectId, { identifier: identifier.trim(), permission });
      setIdentifier("");
      await fetchTeam();
      await onProjectUpdated();
      showMsg("Freelancer added.");
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Failed to add freelancer", "err");
    } finally {
      setAddingMember(false);
    }
  };

  const handlePermissionChange = async (targetUserId: string, next: ProjectPermission) => {
    if (!canManage) return;
    try {
      await apiUpdateFreelancerPermission(projectId, { userId: targetUserId, permission: next });
      await fetchTeam();
      await onProjectUpdated();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Failed to update permission", "err");
    }
  };

  const handleRemoveFreelancer = async (targetUserId: string) => {
    if (!canManage) return;
    if (!window.confirm("Remove this freelancer from the project?")) return;
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
      showMsg("Live status updated.");
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Failed to update live status", "err");
    }
  };

  const handleDeleteProject = async () => {
    if (!canManage) return;
    if (deletePhrase.trim().toLowerCase() !== project.title.trim().toLowerCase()) {
      showMsg("Type the exact project name before deleting.", "err");
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
    <aside>
      {/* Feedback toast */}
      {message && (
        <div style={{
          marginBottom: "0.85rem",
          padding: "0.6rem 0.9rem",
          background: messageType === "err" ? "var(--rs)" : "rgba(74,222,128,0.08)",
          border: `1px solid ${messageType === "err" ? "var(--rg)" : "rgba(74,222,128,0.22)"}`,
          borderRadius: "var(--r)",
          fontSize: "0.77rem",
          color: messageType === "err" ? "var(--red)" : "#4ade80",
        }}>
          {message}
        </div>
      )}

      {/* ── Project Settings ── */}
      <div style={sectionStyle}>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--white)", marginBottom: "0.6rem" }}>
          Project Settings
        </div>

        <div style={{ marginBottom: "0.65rem" }}>
          <label style={labelStyle}>Rename</label>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            style={{ ...inputStyle, borderColor: nameError ? "var(--red)" : "var(--b2)" }}
            disabled={!canManage}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.64rem", color: nameError ? "var(--red)" : "var(--m1)", marginTop: "0.2rem" }}>
            <span>{nameError || "Looks good"}</span>
            <span>{nameInput.trim().length}/80</span>
          </div>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ProjectVisibility)}
            style={selectStyle}
            disabled={!canManage}
          >
            <option value="private">🔒 Private</option>
            <option value="followers-only">👥 Followers Only</option>
            <option value="public">🌐 Public</option>
          </select>
        </div>

        <button
          onClick={handleRename}
          disabled={saving || !!nameError || !canManage}
          className="btn btn-p btn-full"
          style={{ fontSize: "0.79rem" }}
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {/* ── Metadata ── */}
      <div style={sectionStyle}>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--white)", marginBottom: "0.6rem" }}>
          Metadata
        </div>
        {[
          { label: "Created", value: formatDate(project.created_at) },
          { label: "Updated", value: formatDate(project.updated_at) },
          { label: "Owner", value: project.owner?.name || "Unknown" },
        ].map(({ label, value }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: "0.77rem", marginBottom: "0.4rem",
          }}>
            <span style={{ color: "var(--m1)" }}>{label}</span>
            <span style={{ color: "var(--m2)", fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Manage Freelancers ── */}
      <div style={sectionStyle}>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--white)", marginBottom: "0.65rem" }}>
          Manage Freelancers
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: "0.5rem" }}>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="username or email"
            style={{ ...inputStyle, flex: 1 }}
            disabled={!canManage}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddFreelancer(); }}
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as ProjectPermission)}
            style={{ ...selectStyle, width: 86 }}
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
          className="btn btn-s btn-full"
          style={{ fontSize: "0.77rem", marginBottom: "0.75rem" }}
        >
          {addingMember ? "Adding…" : "+ Add Freelancer"}
        </button>

        {/* Team list */}
        {loadingTeam ? (
          <div style={{ fontSize: "0.75rem", color: "var(--m1)" }}>Loading team…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {team.map((member) => (
              <div key={member.id} style={{
                background: "var(--s3)", border: "1px solid var(--b1)",
                borderRadius: "var(--r)", padding: "0.55rem 0.75rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: "0.79rem", fontWeight: 500, color: "var(--white)" }}>{member.name}</div>
                    <div style={{ fontSize: "0.67rem", color: "var(--m1)" }}>{member.email}</div>
                  </div>
                  <span className="tag tag-n" style={{ fontSize: "0.62rem", textTransform: "capitalize" }}>{member.role}</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: "0.4rem" }}>
                  <select
                    value={member.permission || "editor"}
                    onChange={(e) => handlePermissionChange(member.id, e.target.value as ProjectPermission)}
                    style={{ ...selectStyle, flex: 1, height: 30, fontSize: "0.72rem", padding: "0 8px" }}
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
                      style={{
                        height: 30, padding: "0 10px",
                        background: "var(--rs)", border: "1px solid var(--rg)",
                        borderRadius: "var(--r)", fontSize: "0.72rem", color: "var(--red)",
                        cursor: "pointer",
                      }}
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

      {/* ── Active Freelancers ── */}
      <div style={sectionStyle}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: "0.82rem", fontWeight: 600, color: "var(--white)", marginBottom: "0.65rem",
        }}>
          <span>Active Freelancers</span>
          {loadingPresence && (
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              border: "1.5px solid var(--b2)", borderTopColor: "var(--red)",
              animation: "spin 0.8s linear infinite",
            }} />
          )}
        </div>

        {presence.length === 0 ? (
          <div style={{ fontSize: "0.77rem", color: "var(--m1)" }}>No active statuses yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "0.75rem" }}>
            {presence.map((item) => (
              <div key={item.user_id} style={{
                background: "var(--s3)", border: "1px solid var(--b1)",
                borderRadius: "var(--r)", padding: "0.55rem 0.75rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "0.79rem", fontWeight: 500, color: "var(--white)" }}>{item.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--m2)" }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: STATUS_COLORS[item.status] || STATUS_COLORS.offline,
                    }} />
                    {item.status}
                  </div>
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--m1)", marginTop: "0.2rem" }}>
                  {item.current_task ? `Working on: ${item.current_task}` : "No task set"} · {Number(item.hours_logged || 0).toFixed(1)}h logged
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Update my status */}
        <div style={{
          background: "var(--s3)", border: "1px solid var(--b1)",
          borderRadius: "var(--r)", padding: "0.65rem 0.75rem",
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--m1)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
            Update My Status
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <select
              value={myStatus}
              onChange={(e) => setMyStatus(e.target.value as "online" | "away" | "offline")}
              style={{ ...selectStyle, height: 32, fontSize: "0.75rem", padding: "0 8px" }}
            >
              <option value="online">🟢 Online</option>
              <option value="away">🟡 Away</option>
              <option value="offline">⚫ Offline</option>
            </select>
            <input
              value={myTask}
              onChange={(e) => setMyTask(e.target.value)}
              style={{ ...inputStyle, height: 32, fontSize: "0.75rem", padding: "0 8px" }}
              placeholder="Current task"
            />
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="number"
                min={0}
                step={0.1}
                value={myHours}
                onChange={(e) => setMyHours(Number(e.target.value || 0))}
                style={{ ...inputStyle, height: 32, fontSize: "0.75rem", padding: "0 8px", flex: 1 }}
                placeholder="Hours logged"
              />
              <button
                onClick={handleUpdatePresence}
                className="btn btn-p"
                style={{ height: 32, fontSize: "0.73rem", padding: "0 12px", flexShrink: 0 }}
              >
                Sync
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div style={{
        ...sectionStyle,
        background: "rgba(232,57,46,0.06)",
        border: "1px solid rgba(232,57,46,0.25)",
      }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--red)", marginBottom: "0.45rem" }}>
          Danger Zone
        </div>
        <div style={{ fontSize: "0.76rem", color: "var(--m1)", lineHeight: 1.55, marginBottom: "0.65rem" }}>
          Permanently delete this project, including all versions, feedback, team members, and plugin data.
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={!canManage}
          style={{
            width: "100%", padding: "0.55rem 1rem",
            background: "transparent", border: "1px solid rgba(232,57,46,0.45)",
            borderRadius: "var(--r)", fontSize: "0.79rem", color: "var(--red)",
            cursor: canManage ? "pointer" : "not-allowed", opacity: canManage ? 1 : 0.5,
            fontFamily: "var(--fb)",
          }}
        >
          Delete Project…
        </button>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)",
        }}>
          <div style={{
            width: "100%", maxWidth: 420, margin: "0 1rem",
            background: "var(--s1)", border: "1px solid var(--b2)",
            borderRadius: "var(--rxl)", padding: "1.5rem",
            boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--white)", marginBottom: "0.5rem" }}>
              Confirm permanent deletion
            </div>
            <div style={{ fontSize: "0.81rem", color: "var(--m2)", lineHeight: 1.6, marginBottom: "0.85rem" }}>
              This action cannot be undone. Type{" "}
              <span style={{ color: "var(--white)", fontWeight: 600 }}>{project.title}</span>{" "}
              to confirm.
            </div>
            <input
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              style={{ ...inputStyle, marginBottom: "0.85rem" }}
              placeholder={project.title}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePhrase(""); }}
                className="btn btn-g"
                style={{ flex: 1, fontSize: "0.79rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleting || deletePhrase.trim().toLowerCase() !== project.title.trim().toLowerCase()}
                style={{
                  flex: 1, padding: "0.5rem 1rem",
                  background: "rgba(232,57,46,0.15)", border: "1px solid rgba(232,57,46,0.4)",
                  borderRadius: "var(--r)", fontSize: "0.79rem", color: "var(--red)",
                  cursor: "pointer", fontFamily: "var(--fb)",
                  opacity: (deleting || deletePhrase.trim().toLowerCase() !== project.title.trim().toLowerCase()) ? 0.45 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
