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
  type ProjectStatus,
} from "@/lib/api";
import TimelineViewer from "../../components/TimelineViewer";
import ProjectSettingsPanel from "./components/ProjectSettingsPanel";
import ProjectChatRoom from "./components/ProjectChatRoom";

type ProjectData = Awaited<ReturnType<typeof apiGetProject>>;
type FeedbackItem = Awaited<ReturnType<typeof apiGetFeedback>>["feedback"][number];

type Tab = "overview" | "chat" | "feedback";

function statusTag(status: string) {
  if (status === "active") return <span className="tag tag-a">● Active</span>;
  if (status === "pending") return <span className="tag tag-r">⏳ Review</span>;
  if (status === "approved") return <span className="tag tag-d">✓ Approved</span>;
  return <span className="tag tag-n">{status}</span>;
}

const PRIORITY_COLORS: Record<string, string> = {
  High: "rgba(239,68,68,.12)",
  Medium: "rgba(251,191,36,.12)",
  Low: "rgba(74,222,128,.12)",
};
const PRIORITY_TEXT: Record<string, string> = {
  High: "#f87171",
  Medium: "#fbbf24",
  Low: "#4ade80",
};
const PRIORITY_BORDER: Record<string, string> = {
  High: "rgba(239,68,68,.25)",
  Medium: "rgba(251,191,36,.25)",
  Low: "rgba(74,222,128,.25)",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleStatusChange = async (status: string) => {
    setShowStatusMenu(false);
    try {
      await apiUpdateStatus(projectId, status as ProjectStatus);
      fetchProject();
    } catch { /* ignore */ }
  };

  const handleCreateVersion = async () => {
    setCreatingVersion(true);
    try {
      await apiCreateVersion(projectId, versionNotes);
      setVersionNotes("");
      setShowVersionForm(false);
      fetchProject();
    } catch { /* ignore */ }
    finally { setCreatingVersion(false); }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbDescription.trim()) return;
    setAddingFeedback(true);
    try {
      await apiAddFeedback(projectId, {
        type: fbType, priority: fbPriority,
        timestamp: fbTimestamp, description: fbDescription.trim(),
      });
      setFbDescription(""); setFbTimestamp(""); setShowFeedbackForm(false);
      fetchFeedback();
    } catch { /* ignore */ }
    finally { setAddingFeedback(false); }
  };

  const handleResolve = async (feedbackId: string) => {
    try {
      await apiResolveFeedback(feedbackId);
      fetchFeedback();
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          border: "2px solid var(--b2)", borderTopColor: "var(--red)",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mc" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <p style={{ color: "var(--red)", fontSize: "0.9rem", marginBottom: "1rem" }}>
          {error || "Project not found"}
        </p>
        <button className="btn btn-g" onClick={() => router.push("/dashboard/projects")}>
          ← Back to Projects
        </button>
      </div>
    );
  }

  const openFeedback = feedback.filter((f) => f.status === "open");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Project header bar */}
      <div style={{
        padding: "0.85rem 1.75rem",
        borderBottom: "1px solid var(--b2)",
        background: "var(--s1)",
        display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0,
      }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.77rem", color: "var(--m1)" }}>
          <button
            onClick={() => router.push("/dashboard/projects")}
            style={{ color: "var(--m2)", background: "none", border: "none", cursor: "pointer", fontSize: "0.77rem" }}
          >
            Projects
          </button>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span style={{ color: "var(--white)" }}>{project.title}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Actions */}
        <button
          className="btn btn-g btn-sm"
          onClick={() => router.push(`/dashboard/projects/${projectId}/link`)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Premiere Pro
        </button>

        {isClient && (
          <button
            className="btn btn-g btn-sm"
            onClick={() => setShowVersionForm(true)}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            Invite
          </button>
        )}

        {statusTag(project.status)}

        {isClient && (
          <button className="btn btn-p btn-sm" onClick={() => setShowVersionForm(true)}>
            + New version
          </button>
        )}
      </div>

      {/* Project title + meta */}
      <div style={{
        padding: "0.75rem 1.75rem 0",
        background: "var(--s1)",
        borderBottom: "1px solid var(--b2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
          <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--white)" }}>{project.title}</div>
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--m1)", display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.5rem" }}>
          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
          <span>·</span>
          <span>{project.members?.length || 0} members</span>
          {project.currentVersion && (
            <>
              <span>·</span>
              <span>Current: <b style={{ color: "var(--red)" }}>{project.currentVersion.version_name}</b></span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="proj-tab-bar">
        {(["overview", "chat", "feedback"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`proj-tab${activeTab === tab ? " active" : ""}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "feedback" && openFeedback.length > 0 && (
              <span className="proj-tab-count">{openFeedback.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", flex: 1, overflow: "hidden" }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div style={{ padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Premiere Pro */}
            <div>
              <div className="sec-title">Premiere Pro Sequence</div>
              {project.currentVersion?.timeline_data ? (
                <TimelineViewer data={project.currentVersion.timeline_data as Parameters<typeof TimelineViewer>[0]["data"]} />
              ) : (
                <div style={{
                  background: "var(--s3)", border: "1px dashed var(--b2)",
                  borderRadius: "var(--r)", padding: "2rem",
                  textAlign: "center", color: "var(--m1)", fontSize: "0.79rem",
                }}>
                  No timeline data synced yet.
                  <div style={{ marginTop: "0.5rem" }}>
                    <button
                      className="btn btn-g btn-sm"
                      onClick={() => router.push(`/dashboard/projects/${projectId}/link`)}
                    >
                      Connect Premiere Pro plugin →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Description + Deadline */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              <div>
                <div className="sec-title">Description</div>
                <div style={{
                  background: "var(--s3)", border: "1px solid var(--b1)",
                  borderRadius: "var(--r)", padding: "0.8rem 1rem",
                  fontSize: "0.8rem", color: "var(--m2)", lineHeight: 1.55,
                }}>
                  {project.description || "No description provided."}
                </div>
              </div>
              <div>
                <div className="sec-title">Deadline</div>
                <div style={{
                  background: "var(--s3)", border: "1px solid var(--b1)",
                  borderRadius: "var(--r)", padding: "0.8rem 1rem",
                  fontSize: "0.8rem", color: "var(--m2)",
                }}>
                  {project.deadline ? (
                    <>
                      <div style={{ fontSize: "0.7rem", color: "var(--m1)", marginBottom: "0.25rem" }}>Target date</div>
                      <div style={{ fontWeight: 500, color: "var(--white)" }}>
                        {new Date(project.deadline).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </div>
                      {new Date(project.deadline) < new Date() && (
                        <div style={{ fontSize: "0.7rem", color: "var(--red)", marginTop: "0.25rem" }}>⚠ Deadline has passed</div>
                      )}
                    </>
                  ) : (
                    <span style={{ color: "var(--m1)" }}>No deadline set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Versions */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div className="sec-title" style={{ margin: 0 }}>Versions</div>
                <button className="btn btn-g btn-sm" onClick={() => setShowVersionForm((v) => !v)}>
                  + New version
                </button>
              </div>

              {/* New version form */}
              {showVersionForm && (
                <div style={{
                  marginBottom: "0.85rem",
                  padding: "0.85rem 1rem",
                  background: "var(--s3)", border: "1px solid var(--b2)",
                  borderRadius: "var(--r)",
                  display: "flex", flexDirection: "column", gap: "0.6rem",
                }}>
                  <textarea
                    value={versionNotes}
                    onChange={(e) => setVersionNotes(e.target.value)}
                    placeholder="Version notes (optional)"
                    rows={2}
                    style={{
                      width: "100%", padding: "0.5rem 0.75rem",
                      background: "var(--s2)", border: "1px solid var(--b2)",
                      borderRadius: "var(--r)", fontSize: "0.81rem",
                      color: "var(--white)", outline: "none", resize: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-p btn-sm" onClick={handleCreateVersion} disabled={creatingVersion}>
                      {creatingVersion ? "Creating…" : "Create Version"}
                    </button>
                    <button className="btn btn-g btn-sm" onClick={() => setShowVersionForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Version timeline */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {project.currentVersion && (
                  <div className="vt-item">
                    <div className="vt-line" />
                    <div className="vt-dot current">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--white)", marginBottom: "0.15rem" }}>
                        {project.currentVersion.version_name} — Current{" "}
                        <span style={{ color: "var(--m1)", fontWeight: 400 }}>
                          · {new Date(project.currentVersion.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {project.currentVersion.notes && (
                        <div className="vt-note">{project.currentVersion.notes}</div>
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--white)", marginBottom: "0.15rem" }}>
                          {v.version_name}{" "}
                          <span style={{ color: "var(--m1)", fontWeight: 400 }}>
                            · {new Date(v.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {v.notes && <div className="vt-note">{v.notes}</div>}
                      </div>
                    </div>
                  ))}
                {project.versions.length === 0 && (
                  <div style={{ fontSize: "0.8rem", color: "var(--m1)" }}>No versions yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CHAT TAB ── */}
        {activeTab === "chat" && (
          <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <ProjectChatRoom projectId={projectId} />
          </div>
        )}

        {/* ── FEEDBACK TAB ── */}
        {activeTab === "feedback" && (
          <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto" }}>
            {/* Filter + add */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.1rem", flexWrap: "wrap" }}>
              <button className="filter-chip active">All <span style={{ fontSize: "0.62rem", background: "var(--s4)", borderRadius: 3, padding: "0 5px" }}>{feedback.length}</span></button>
              <button className="filter-chip">Open <span style={{ fontSize: "0.62rem", background: "var(--s4)", borderRadius: 3, padding: "0 5px" }}>{openFeedback.length}</span></button>
              <button className="filter-chip">Resolved <span style={{ fontSize: "0.62rem", background: "var(--s4)", borderRadius: 3, padding: "0 5px" }}>{feedback.filter(f => f.status !== "open").length}</span></button>
              <div style={{ marginLeft: "auto" }}>
                {isClient && (
                  <button className="btn btn-p btn-sm" onClick={() => setShowFeedbackForm((v) => !v)}>
                    + Add feedback
                  </button>
                )}
              </div>
            </div>

            {/* Feedback form */}
            {showFeedbackForm && (
              <form onSubmit={handleAddFeedback} style={{
                background: "var(--s1)", border: "1px solid var(--b2)",
                borderRadius: "var(--rl)", padding: "1rem 1.1rem",
                marginBottom: "0.85rem", display: "flex", flexDirection: "column", gap: "0.75rem",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                  <div>
                    <label className="sec-title" style={{ display: "block" }}>Type</label>
                    <select
                      value={fbType}
                      onChange={(e) => setFbType(e.target.value)}
                      style={{
                        width: "100%", height: 36, padding: "0 10px",
                        background: "var(--s3)", border: "1px solid var(--b2)",
                        borderRadius: "var(--r)", fontSize: "0.8rem", color: "var(--white)",
                        outline: "none", colorScheme: "dark",
                      }}
                    >
                      <option value="Revision">Revision</option>
                      <option value="Bug">Bug</option>
                      <option value="Enhancement">Enhancement</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="sec-title" style={{ display: "block" }}>Priority</label>
                    <select
                      value={fbPriority}
                      onChange={(e) => setFbPriority(e.target.value)}
                      style={{
                        width: "100%", height: 36, padding: "0 10px",
                        background: "var(--s3)", border: "1px solid var(--b2)",
                        borderRadius: "var(--r)", fontSize: "0.8rem", color: "var(--white)",
                        outline: "none", colorScheme: "dark",
                      }}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="sec-title" style={{ display: "block" }}>Timestamp</label>
                  <input
                    type="text"
                    value={fbTimestamp}
                    onChange={(e) => setFbTimestamp(e.target.value)}
                    placeholder="e.g. 00:45"
                    style={{
                      width: "100%", height: 36, padding: "0 10px",
                      background: "var(--s3)", border: "1px solid var(--b2)",
                      borderRadius: "var(--r)", fontSize: "0.8rem", color: "var(--white)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label className="sec-title" style={{ display: "block" }}>Description</label>
                  <textarea
                    value={fbDescription}
                    onChange={(e) => setFbDescription(e.target.value)}
                    placeholder="Describe the feedback…"
                    rows={3}
                    style={{
                      width: "100%", padding: "0.5rem 0.75rem",
                      background: "var(--s3)", border: "1px solid var(--b2)",
                      borderRadius: "var(--r)", fontSize: "0.8rem",
                      color: "var(--white)", outline: "none", resize: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="submit" className="btn btn-p btn-sm" disabled={addingFeedback}>
                    {addingFeedback ? "Submitting…" : "Submit feedback"}
                  </button>
                  <button type="button" className="btn btn-g btn-sm" onClick={() => setShowFeedbackForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Feedback cards */}
            {feedback.length === 0 ? (
              <div style={{
                border: "1px dashed var(--b2)", borderRadius: "var(--rl)",
                padding: "2rem", textAlign: "center", color: "var(--m1)", fontSize: "0.8rem",
              }}>
                No feedback yet. Click <b style={{ color: "var(--white)" }}>+ Add feedback</b> to leave timestamped notes.
              </div>
            ) : (
              feedback.map((item) => (
                <div key={item.id} className="fb-full-card" style={{ opacity: item.status !== "open" ? 0.65 : 1 }}>
                  <div className="fb-fc-header">
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "var(--red)", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "0.58rem", fontWeight: 700, color: "#fff",
                    }}>
                      {item.creator_name?.slice(0, 2).toUpperCase() || "??"}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--white)" }}>{item.creator_name}</div>
                      <div style={{ fontSize: "0.67rem", color: "var(--m1)" }}>
                        {item.status === "open" ? "Open" : "Resolved"}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.67rem", color: "var(--m1)", marginLeft: "auto" }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ padding: "0.85rem 1.1rem" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--m2)", lineHeight: 1.6, marginBottom: "0.65rem" }}>
                      {item.description}
                    </div>

                    {/* Tags */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.65rem" }}>
                      <span style={{
                        background: "rgba(99,102,241,.12)", color: "#a5b4fc",
                        borderColor: "rgba(99,102,241,.25)",
                        padding: "2px 8px", borderRadius: 5, fontSize: "0.67rem", fontWeight: 600,
                        border: "1px solid",
                      }}>{item.type}</span>
                      <span style={{
                        background: PRIORITY_COLORS[item.priority] || "var(--s3)",
                        color: PRIORITY_TEXT[item.priority] || "var(--m2)",
                        borderColor: PRIORITY_BORDER[item.priority] || "var(--b2)",
                        padding: "2px 8px", borderRadius: 5, fontSize: "0.67rem", fontWeight: 600,
                        border: "1px solid",
                      }}>{item.priority} priority</span>
                      {item.timestamp && (
                        <span className="tag tag-n">@ {item.timestamp}</span>
                      )}
                      {item.version_name && (
                        <span className="tag tag-n">{item.version_name}</span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button className="btn btn-g btn-sm">Reply</button>
                      {item.status === "open" && (
                        <button
                          className="btn btn-sm"
                          style={{
                            background: "rgba(74,222,128,.15)", color: "#4ade80",
                            borderColor: "rgba(74,222,128,.25)",
                          }}
                          onClick={() => handleResolve(item.id)}
                        >
                          ✓ Mark resolved
                        </button>
                      )}
                      <button className="btn btn-g btn-sm" style={{ marginLeft: "auto" }}>⋯ More</button>
                    </div>
                  </div>

                  <div className="fb-open-bar">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Status:{" "}
                    <b style={{ color: item.status === "open" ? "var(--red)" : "#4ade80" }}>
                      {item.status === "open" ? "Open" : "Resolved"}
                    </b>
                    {" "}· Add a reply to this feedback thread
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Right metadata panel */}
        <div style={{
          borderLeft: "1px solid var(--b2)",
          background: "var(--s1)", overflowY: "auto",
          padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem",
        }}>
          {/* Project info */}
          <div>
            <div className="sec-title">Project info</div>
            <div className="info-pair">
              <span className="info-k">Status</span>
              <span className="info-v">{statusTag(project.status)}</span>
            </div>
            <div className="info-pair">
              <span className="info-k">Created</span>
              <span className="info-v">{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            <div className="info-pair">
              <span className="info-k">Visibility</span>
              <span className="info-v">Public</span>
            </div>
            {project.currentVersion && (
              <div className="info-pair">
                <span className="info-k">Version</span>
                <span className="info-v" style={{ color: "var(--red)" }}>{project.currentVersion.version_name}</span>
              </div>
            )}
            {isClient && (
              <div style={{ marginTop: "0.5rem", position: "relative" }}>
                <button
                  className="btn btn-g btn-sm"
                  style={{ width: "100%" }}
                  onClick={() => setShowStatusMenu((v) => !v)}
                >
                  Change status ▾
                </button>
                {showStatusMenu && (
                  <div style={{
                    position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)",
                    background: "var(--s3)", border: "1px solid var(--b2)",
                    borderRadius: "var(--r)", zIndex: 10, overflow: "hidden",
                  }}>
                    {["active", "pending", "completed", "approved"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        style={{
                          width: "100%", textAlign: "left", padding: "7px 11px",
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: "0.78rem", color: "var(--m2)", transition: "all 0.1s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--white)"; e.currentTarget.style.background = "var(--s4)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--m2)"; e.currentTarget.style.background = "none"; }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Team */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <div className="sec-title" style={{ margin: 0 }}>Team</div>
              <button className="btn btn-g btn-sm">+ Add</button>
            </div>
            {project.members.map((member) => (
              <div key={member.id} style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.5rem 0", borderBottom: "1px solid var(--b1)",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: member.role === "client" ? "var(--red)" : "#7dd3fc",
                  color: member.role === "client" ? "#fff" : "#0d0f0e",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.54rem", fontWeight: 700, flexShrink: 0,
                }}>
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.79rem", fontWeight: 500, color: "var(--white)" }}>{member.name}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--m1)" }}>{member.email}</div>
                </div>
                <span className="tag tag-n" style={{ fontSize: "0.6rem", textTransform: "uppercase" }}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>

          {/* Settings panel (preserved) */}
          <ProjectSettingsPanel
            projectId={projectId}
            project={project}
            user={user}
            onProjectUpdated={fetchProject}
          />

          {/* CTAs */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <button className="btn btn-p btn-full" onClick={() => setShowVersionForm(true)}>
              + Submit new version
            </button>
            <button className="btn btn-g btn-full">Request approval</button>
          </div>
        </div>
      </div>
    </div>
  );
}
