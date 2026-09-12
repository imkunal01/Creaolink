"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, type User } from "@/lib/auth";
import {
  apiCreateVersion,
  type ProjectStatus,
} from "@/lib/api";
import { useProject } from "@/lib/hooks/use-projects";
import { useProjectFeedback } from "@/lib/hooks/use-feedback";
import { ProjectDetailSkeleton } from "../../components/DashboardSkeletons";
import TimelineViewer from "../../components/TimelineViewer";
import ProjectSettingsPanel from "./components/ProjectSettingsPanel";
import ProjectChatRoom from "./components/ProjectChatRoom";

type Tab = "overview" | "chat" | "feedback";

function statusTag(status: string) {
  if (status === "active") return <span className="tag tag-a">Active</span>;
  if (status === "pending") return <span className="tag tag-r">In Review</span>;
  if (status === "approved" || status === "completed") return <span className="tag tag-d">Approved</span>;
  return <span className="tag tag-n">{status}</span>;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  High: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  Medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  Low: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const {
    project,
    isLoading: loadingProject,
    error: projectError,
    mutate: mutateProject,
    updateStatus,
  } = useProject(projectId);

  const {
    feedback,
    isLoading: loadingFeedback,
    addFeedback,
    resolveFeedback,
  } = useProjectFeedback(projectId);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [versionNotes, setVersionNotes] = useState("");
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [fbType, setFbType] = useState("Revision");
  const [fbPriority, setFbPriority] = useState("Medium");
  const [fbTimestamp, setFbTimestamp] = useState("");
  const [fbDescription, setFbDescription] = useState("");
  const [addingFeedback, setAddingFeedback] = useState(false);

  const isClient = user?.role === "client" || user?.role === "admin";

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleStatusChange = async (status: string) => {
    setShowStatusMenu(false);
    try {
      await updateStatus(status as ProjectStatus);
    } catch { /* ignore */ }
  };

  const handleCreateVersion = async () => {
    setCreatingVersion(true);
    try {
      await apiCreateVersion(projectId, versionNotes);
      setVersionNotes("");
      setShowVersionForm(false);
      mutateProject();
    } catch { /* ignore */ }
    finally { setCreatingVersion(false); }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbDescription.trim()) return;
    setAddingFeedback(true);
    try {
      await addFeedback(
        {
          type: fbType,
          priority: fbPriority,
          timestamp: fbTimestamp,
          description: fbDescription.trim(),
        },
        user?.name || "You"
      );
      setFbDescription("");
      setFbTimestamp("");
      setShowFeedbackForm(false);
    } catch { /* ignore */ }
    finally { setAddingFeedback(false); }
  };

  const handleResolve = async (feedbackId: string) => {
    try {
      await resolveFeedback(feedbackId);
    } catch { /* ignore */ }
  };

  const loading = loadingProject && !project;
  const error = projectError ? (projectError instanceof Error ? projectError.message : "Failed to load project") : "";

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="mc text-center pt-16">
        <p className="text-xs font-mono text-red-400 mb-4">
          {error || "Project room not found"}
        </p>
        <button className="btn btn-g btn-sm" onClick={() => router.push("/dashboard/projects")}>
          Return to Projects
        </button>
      </div>
    );
  }

  const openFeedback = feedback.filter((f) => f.status === "open");

  return (
    <div className="flex flex-col h-full bg-[#08090a]">
      {/* Top Action Header Bar */}
      <div className="px-6 py-3 border-b border-white/[0.08] bg-[#0d0e10] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <Link
            href="/dashboard/projects"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Projects
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-white font-medium truncate max-w-[200px]">{project.title}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            className="btn btn-g btn-sm"
            onClick={() => router.push(`/dashboard/projects/${projectId}/link`)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Premiere Pro Sync
          </button>

          {statusTag(project.status)}

          {isClient && (
            <button className="btn btn-p btn-sm" onClick={() => setShowVersionForm(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Version
            </button>
          )}
        </div>
      </div>

      {/* Project Title and Metadata Subheader */}
      <div className="px-6 py-4 bg-[#0d0e10]/60 border-b border-white/[0.06]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-bold text-white tracking-tight">
            {project.title}
          </h1>
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
            <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
            <span>&middot;</span>
            <span>{project.members?.length || 0} members</span>
            {project.currentVersion && (
              <>
                <span>&middot;</span>
                <span className="text-[#00e5ff] font-semibold">Active: {project.currentVersion.version_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="proj-tab-bar bg-[#0d0e10]">
        {(["overview", "chat", "feedback"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`proj-tab${activeTab === tab ? " active" : ""}`}
          >
            {tab === "overview" ? "Timeline & Specs" : tab === "chat" ? "Workspace Chat" : "Review Feedback"}
            {tab === "feedback" && openFeedback.length > 0 && (
              <span className="proj-tab-count font-mono">{openFeedback.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 flex-1 overflow-hidden">
        {/* Main 3 cols */}
        <div className="lg:col-span-3 overflow-y-auto p-6 space-y-6">
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Premiere Pro Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Premiere Pro Timeline Sequence
                  </h2>
                  {project.currentVersion && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      Tracking sequence: {project.currentVersion.version_name}
                    </span>
                  )}
                </div>
                {project.currentVersion?.timeline_data ? (
                  <TimelineViewer data={project.currentVersion.timeline_data as Parameters<typeof TimelineViewer>[0]["data"]} />
                ) : (
                  <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#0d0e10] p-8 text-center">
                    <p className="text-xs font-mono text-zinc-400 mb-3">
                      No sequence metadata synced from Adobe Premiere Pro yet.
                    </p>
                    <button
                      className="btn btn-g btn-sm"
                      onClick={() => router.push(`/dashboard/projects/${projectId}/link`)}
                    >
                      Connect Premiere Pro Extension &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* Description + Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#141618]">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Creative Brief & Requirements
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#141618]">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Delivery Schedule
                  </h3>
                  {project.deadline ? (
                    <div>
                      <div className="text-sm font-semibold text-white font-mono">
                        {new Date(project.deadline).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </div>
                      {new Date(project.deadline) < new Date() && (
                        <div className="text-xs font-mono text-red-400 mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          Delivery deadline has passed
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-zinc-500">Flexible / No hard deadline set</span>
                  )}
                </div>
              </div>

              {/* Versions Stack */}
              <div className="p-5 rounded-xl border border-white/[0.08] bg-[#141618]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Version History Stack
                  </h3>
                  <button className="btn btn-g btn-sm" onClick={() => setShowVersionForm((v) => !v)}>
                    + Add Version Cut
                  </button>
                </div>

                {showVersionForm && (
                  <div className="mb-4 p-4 rounded-lg bg-[#0d0e10] border border-white/[0.08] space-y-3">
                    <textarea
                      value={versionNotes}
                      onChange={(e) => setVersionNotes(e.target.value)}
                      placeholder="Version changelog and render notes..."
                      rows={2}
                      className="w-full p-2.5 rounded-md bg-[#141618] border border-white/[0.08] text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00e5ff]/60 resize-none"
                    />
                    <div className="flex gap-2">
                      <button className="btn btn-p btn-sm" onClick={handleCreateVersion} disabled={creatingVersion}>
                        {creatingVersion ? "Deploying..." : "Publish Version"}
                      </button>
                      <button className="btn btn-g btn-sm" onClick={() => setShowVersionForm(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {project.currentVersion && (
                    <div className="vt-item">
                      <div className="vt-line" />
                      <div className="vt-dot current">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          <span>{project.currentVersion.version_name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20">
                            Active Cut
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 font-normal">
                            &middot; {new Date(project.currentVersion.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {project.currentVersion.notes && (
                          <div className="vt-note mt-1">{project.currentVersion.notes}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {project.versions
                    .filter((v) => v.id !== project.currentVersion?.id)
                    .reverse()
                    .map((v) => (
                      <div className="vt-item" key={v.id}>
                        <div className="vt-dot" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-zinc-300">
                            {v.version_name}{" "}
                            <span className="text-[10px] font-mono text-zinc-500 font-normal">
                              &middot; {new Date(v.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {v.notes && <div className="vt-note mt-1">{v.notes}</div>}
                        </div>
                      </div>
                    ))}
                  {project.versions.length === 0 && (
                    <div className="text-xs font-mono text-zinc-500">No versions tracked yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── CHAT TAB ── */}
          {activeTab === "chat" && (
            <div className="h-[600px] rounded-xl border border-white/[0.08] overflow-hidden bg-[#0d0e10]">
              <ProjectChatRoom projectId={projectId} />
            </div>
          )}

          {/* ── FEEDBACK TAB ── */}
          {activeTab === "feedback" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="tag tag-n font-mono">{feedback.length} Total</span>
                  <span className="tag tag-r font-mono">{openFeedback.length} Open</span>
                </div>
                {isClient && (
                  <button className="btn btn-p btn-sm" onClick={() => setShowFeedbackForm((v) => !v)}>
                    + Add Timestamped Feedback
                  </button>
                )}
              </div>

              {/* Feedback form */}
              {showFeedbackForm && (
                <form onSubmit={handleAddFeedback} className="p-4 rounded-xl border border-white/[0.1] bg-[#141618] space-y-3 shadow-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Issue Type</label>
                      <select
                        value={fbType}
                        onChange={(e) => setFbType(e.target.value)}
                        className="w-full h-8 px-2 rounded bg-[#0d0e10] border border-white/[0.08] text-xs text-white outline-none [color-scheme:dark]"
                      >
                        <option value="Revision">Revision</option>
                        <option value="Audio">Audio Mix</option>
                        <option value="Color">Color Grade</option>
                        <option value="Pacing">Pacing & Cut</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Priority</label>
                      <select
                        value={fbPriority}
                        onChange={(e) => setFbPriority(e.target.value)}
                        className="w-full h-8 px-2 rounded bg-[#0d0e10] border border-white/[0.08] text-xs text-white outline-none [color-scheme:dark]"
                      >
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Sequence Timestamp (optional)</label>
                    <input
                      type="text"
                      value={fbTimestamp}
                      onChange={(e) => setFbTimestamp(e.target.value)}
                      placeholder="e.g. 01:24 or 00:01:24:12"
                      className="w-full h-8 px-2.5 rounded bg-[#0d0e10] border border-white/[0.08] text-xs text-white font-mono placeholder:text-zinc-600 outline-none focus:border-[#00e5ff]/60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Feedback Description</label>
                    <textarea
                      value={fbDescription}
                      onChange={(e) => setFbDescription(e.target.value)}
                      placeholder="Specific note or instruction for the editor..."
                      rows={3}
                      className="w-full p-2.5 rounded bg-[#0d0e10] border border-white/[0.08] text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00e5ff]/60 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-p btn-sm" disabled={addingFeedback}>
                      {addingFeedback ? "Posting..." : "Post Feedback Item"}
                    </button>
                    <button type="button" className="btn btn-g btn-sm" onClick={() => setShowFeedbackForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Feedback List */}
              {feedback.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-white/[0.08] bg-[#0d0e10]">
                  <p className="text-xs font-mono text-zinc-400">
                    No feedback items logged. All reviews clear.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedback.map((item) => {
                    const priorityStyle = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.Medium;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border bg-[#141618] p-4 transition-opacity ${
                          item.status !== "open" ? "opacity-60 border-white/[0.04]" : "border-white/[0.08]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#00e5ff]/15 font-mono text-[9px] font-bold text-[#00e5ff]">
                              {item.creator_name?.slice(0, 2).toUpperCase() || "CR"}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white">{item.creator_name}</div>
                              <div className="text-[10px] font-mono text-zinc-500">
                                {new Date(item.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                              {item.priority}
                            </span>
                            {item.timestamp && (
                              <span className="tag tag-n font-mono">@{item.timestamp}</span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                          <span className={`text-[11px] font-mono ${item.status === "open" ? "text-[#00e5ff]" : "text-emerald-400"}`}>
                            Status: {item.status === "open" ? "Open" : "Resolved"}
                          </span>
                          {item.status === "open" && (
                            <button
                              className="btn btn-g btn-sm text-[10px]"
                              onClick={() => handleResolve(item.id)}
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar Metadata */}
        <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-[#0d0e10] p-5 space-y-6 overflow-y-auto">
          {/* Project Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Room Specs
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-zinc-500 font-mono">Status</span>
                <span className="text-zinc-300 font-medium capitalize">{project.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-zinc-500 font-mono">Version</span>
                <span className="text-[#00e5ff] font-mono">{project.currentVersion?.version_name || "v1"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-zinc-500 font-mono">Visibility</span>
                <span className="text-zinc-300">Workspace</span>
              </div>
            </div>

            {isClient && (
              <div className="mt-3 relative">
                <button
                  className="btn btn-g btn-sm w-full"
                  onClick={() => setShowStatusMenu((v) => !v)}
                >
                  Update Status
                </button>
                {showStatusMenu && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#141618] border border-white/[0.1] rounded-md shadow-2xl z-30 overflow-hidden">
                    {["active", "pending", "completed", "approved"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-[#1c1e22] hover:text-white capitalize transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Team Collaborators */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Collaborators ({project.members?.length || 0})
            </h3>
            <div className="space-y-2">
              {project.members?.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-[#1c1e22] border border-white/[0.08] font-mono text-[9px] text-zinc-300">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xs text-zinc-200 truncate">{m.name}</div>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Settings Accordion */}
          <div className="pt-2 border-t border-white/[0.06]">
            <ProjectSettingsPanel
              projectId={projectId}
              project={project}
              user={user}
              onProjectUpdated={async () => {
                await mutateProject();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
