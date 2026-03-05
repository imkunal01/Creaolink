"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import {
  apiGetProject,
  apiUpdateStatus,
  apiCreateVersion,
  apiAddFeedback,
  apiGetFeedback,
  apiResolveFeedback,
} from "@/lib/api";

type ProjectData = Awaited<ReturnType<typeof apiGetProject>>;
type FeedbackItem = Awaited<ReturnType<typeof apiGetFeedback>>["feedback"][number];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "feedback">("overview");

  // Status dropdown
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Version creation
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [versionNotes, setVersionNotes] = useState("");
  const [creatingVersion, setCreatingVersion] = useState(false);

  // Feedback form
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [fbType, setFbType] = useState("Revision");
  const [fbPriority, setFbPriority] = useState("Medium");
  const [fbTimestamp, setFbTimestamp] = useState("");
  const [fbDescription, setFbDescription] = useState("");
  const [addingFeedback, setAddingFeedback] = useState(false);

  const isClient = user?.role === "client" || user?.role === "admin";

  const fetchProject = useCallback(async () => {
    try {
      const data = await apiGetProject(projectId);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchFeedback = useCallback(async () => {
    try {
      const { feedback: list } = await apiGetFeedback(projectId);
      setFeedback(list);
    } catch {
      // ignore
    }
  }, [projectId]);

  useEffect(() => {
    setUser(getUser());
    fetchProject();
    fetchFeedback();
  }, [fetchProject, fetchFeedback]);

  // ── Status Update ──
  const handleStatusChange = async (status: string) => {
    setShowStatusMenu(false);
    try {
      await apiUpdateStatus(projectId, status);
      fetchProject();
    } catch {
      // ignore
    }
  };

  // ── Version Create ──
  const handleCreateVersion = async () => {
    setCreatingVersion(true);
    try {
      await apiCreateVersion(projectId, versionNotes);
      setVersionNotes("");
      setShowVersionForm(false);
      fetchProject();
    } catch {
      // ignore
    } finally {
      setCreatingVersion(false);
    }
  };

  // ── Feedback Add ──
  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbDescription.trim()) return;
    setAddingFeedback(true);
    try {
      await apiAddFeedback(projectId, {
        type: fbType,
        priority: fbPriority,
        timestamp: fbTimestamp,
        description: fbDescription.trim(),
      });
      setFbDescription("");
      setFbTimestamp("");
      setShowFeedbackForm(false);
      fetchFeedback();
    } catch {
      // ignore
    } finally {
      setAddingFeedback(false);
    }
  };

  // ── Feedback Resolve ──
  const handleResolve = async (feedbackId: string) => {
    try {
      await apiResolveFeedback(feedbackId);
      fetchFeedback();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-text-tertiary border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-error mb-4">{error || "Project not found"}</p>
        <button
          onClick={() => router.push("/dashboard/projects")}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-success/15 text-success",
    completed: "bg-text-tertiary/15 text-text-secondary",
    approved: "bg-blue-500/15 text-blue-400",
    pending: "bg-amber-500/15 text-amber-400",
  };

  const priorityColors: Record<string, string> = {
    High: "text-error",
    Medium: "text-amber-400",
    Low: "text-text-secondary",
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/projects")}
        className="text-sm text-text-tertiary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Projects
      </button>

      {/* ━━━ Top Section: Title + Status ━━━ */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-text-primary truncate">{project.title}</h1>
            <p className="text-sm text-text-tertiary mt-1">
              Created {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Status badge / dropdown */}
          <div className="relative">
            {isClient ? (
              <button
                onClick={() => setShowStatusMenu((v) => !v)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer ${statusColors[project.status] || statusColors.active}`}
              >
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)} ▾
              </button>
            ) : (
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusColors[project.status] || statusColors.active}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            )}
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 bg-bg-tertiary border border-border rounded-lg shadow-xl z-10 min-w-[140px]">
                {["active", "pending", "completed", "approved"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-border/30 transition-colors first:rounded-t-lg last:rounded-b-lg cursor-pointer"
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ━━━ Tabs ━━━ */}
      <div className="flex gap-1 border-b border-border">
        {(["overview", "feedback"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === tab
                ? "text-text-primary border-accent"
                : "text-text-tertiary border-transparent hover:text-text-secondary"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "feedback" && feedback.length > 0 && (
              <span className="ml-2 text-xs text-text-tertiary">({feedback.filter((f) => f.status === "open").length})</span>
            )}
          </button>
        ))}
      </div>

      {/* ━━━ Overview Tab ━━━ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Description + Deadline */}
          <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Description</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {project.description || "No description provided."}
              </p>
            </div>
            {project.deadline && (
              <div>
                <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Deadline</h3>
                <p className="text-sm text-text-secondary">
                  {new Date(project.deadline).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Current Version + Version History */}
          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Versions</h3>
              <button
                onClick={() => setShowVersionForm((v) => !v)}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                + New Version
              </button>
            </div>

            {/* New version form */}
            {showVersionForm && (
              <div className="mb-4 p-4 bg-bg-tertiary border border-border rounded-lg space-y-3">
                <textarea
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  placeholder="Version notes (optional)"
                  rows={2}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateVersion}
                    disabled={creatingVersion}
                    className="px-4 py-2 bg-accent text-bg rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {creatingVersion ? "Creating..." : "Create Version"}
                  </button>
                  <button
                    onClick={() => setShowVersionForm(false)}
                    className="px-4 py-2 text-xs text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Current */}
            {project.currentVersion && (
              <div className="flex items-center gap-3 mb-3 px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm font-medium text-text-primary">
                  {project.currentVersion.version_name}
                </span>
                <span className="text-xs text-text-tertiary">— Current</span>
                {project.currentVersion.notes && (
                  <span className="text-xs text-text-tertiary ml-auto truncate max-w-[200px]">
                    {project.currentVersion.notes}
                  </span>
                )}
              </div>
            )}

            {/* History */}
            {project.versions.length > 1 && (
              <div className="space-y-1.5">
                {project.versions
                  .filter((v) => v.id !== project.currentVersion?.id)
                  .reverse()
                  .map((v) => (
                    <div key={v.id} className="flex items-center gap-3 px-3 py-2 text-text-tertiary">
                      <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary/50" />
                      <span className="text-sm">{v.version_name}</span>
                      {v.notes && (
                        <span className="text-xs truncate max-w-[200px]">{v.notes}</span>
                      )}
                      <span className="text-xs ml-auto">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-4">Team Members</h3>
            <div className="space-y-3">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-xs font-medium text-text-secondary">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{member.name}</p>
                    <p className="text-xs text-text-tertiary">{member.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    member.role === "client"
                      ? "bg-blue-500/15 text-blue-400"
                      : member.role === "admin"
                      ? "bg-purple-500/15 text-purple-400"
                      : "bg-success/15 text-success"
                  }`}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ━━━ Feedback Tab ━━━ */}
      {activeTab === "feedback" && (
        <div className="space-y-4">
          {/* Add feedback button (client only) */}
          {isClient && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowFeedbackForm((v) => !v)}
                className="px-4 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
              >
                + Add Feedback
              </button>
            </div>
          )}

          {/* Feedback form */}
          {showFeedbackForm && (
            <form onSubmit={handleAddFeedback} className="bg-bg-secondary border border-border rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-tertiary mb-1.5">Type</label>
                  <select
                    value={fbType}
                    onChange={(e) => setFbType(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-border-hover [color-scheme:dark]"
                  >
                    <option value="Revision">Revision</option>
                    <option value="Bug">Bug</option>
                    <option value="Enhancement">Enhancement</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-tertiary mb-1.5">Priority</label>
                  <select
                    value={fbPriority}
                    onChange={(e) => setFbPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-border-hover [color-scheme:dark]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1.5">Timestamp</label>
                <input
                  type="text"
                  value={fbTimestamp}
                  onChange={(e) => setFbTimestamp(e.target.value)}
                  placeholder="e.g. 00:45"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover"
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1.5">Description</label>
                <textarea
                  value={fbDescription}
                  onChange={(e) => setFbDescription(e.target.value)}
                  placeholder="Describe the feedback..."
                  rows={3}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingFeedback}
                  className="px-4 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
                >
                  {addingFeedback ? "Submitting..." : "Submit Feedback"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFeedbackForm(false)}
                  className="px-4 py-2 text-sm text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Feedback List */}
          {feedback.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-xl py-16 text-center">
              <p className="text-sm text-text-tertiary">No feedback yet.</p>
              {isClient && (
                <p className="text-xs text-text-tertiary mt-1">Add feedback to guide the freelancer.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className={`bg-bg-secondary border rounded-xl p-5 ${
                    item.status === "resolved" ? "border-border/50 opacity-70" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">
                        {item.type}
                      </span>
                      <span className={`text-xs font-medium ${priorityColors[item.priority] || "text-text-secondary"}`}>
                        {item.priority}
                      </span>
                      {item.timestamp && (
                        <span className="text-xs text-text-tertiary">@ {item.timestamp}</span>
                      )}
                      <span className="text-xs text-text-tertiary">
                        {item.version_name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                        item.status === "open"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-success/15 text-success"
                      }`}
                    >
                      {item.status === "open" ? "Open" : "Resolved"}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">
                      {item.creator_name} · {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    {/* Freelancer can resolve open feedback */}
                    {!isClient && item.status === "open" && (
                      <button
                        onClick={() => handleResolve(item.id)}
                        className="text-xs text-success hover:text-success/80 transition-colors cursor-pointer"
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
