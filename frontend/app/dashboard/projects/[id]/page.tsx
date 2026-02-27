"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Version {
  id: string;
  project_id: string;
  version_name: string;
  notes: string;
  created_at: string;
}

interface FeedbackItem {
  id: string;
  project_id: string;
  version_id: string;
  created_by: string;
  created_by_name: string;
  created_by_role: string;
  type: string;
  priority: string;
  timestamp: string;
  description: string;
  status: "open" | "resolved";
  version_name: string;
  created_at: string;
}

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: "active" | "completed" | "approved" | "paused";
  current_version_id: string | null;
  created_by: string;
  created_at: string;
  currentVersion: Version | null;
  versions: Version[];
  members: Member[];
  feedback: FeedbackItem[];
}

const statusOptions = ["active", "completed", "approved", "paused"] as const;

const statusColors: Record<string, string> = {
  active: "bg-success/15 text-success border-success/20",
  completed: "bg-text-tertiary/15 text-text-secondary border-text-tertiary/20",
  approved: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  paused: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

const priorityColors: Record<string, string> = {
  High: "text-error",
  Medium: "text-amber-400",
  Low: "text-text-secondary",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Version creation
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [versionNotes, setVersionNotes] = useState("");
  const [versionLoading, setVersionLoading] = useState(false);

  // Feedback form
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState("Revision");
  const [feedbackPriority, setFeedbackPriority] = useState("Medium");
  const [feedbackTimestamp, setFeedbackTimestamp] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<"overview" | "feedback">(
    "overview"
  );

  const fetchProject = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load project");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setUser(getUser());
    fetchProject();
  }, [fetchProject]);

  const isClient =
    user && project && project.created_by === user.id;
  const isFreelancer = user?.role === "freelancer";

  // --- Status Update ---
  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    setShowStatusDropdown(false);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchProject();
      }
    } catch {
      // silently fail
    } finally {
      setStatusLoading(false);
    }
  };

  // --- Version Creation ---
  const handleCreateVersion = async () => {
    setVersionLoading(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/version`, {
        method: "POST",
        body: JSON.stringify({ notes: versionNotes }),
      });
      if (res.ok) {
        setShowVersionForm(false);
        setVersionNotes("");
        await fetchProject();
      }
    } catch {
      // silently fail
    } finally {
      setVersionLoading(false);
    }
  };

  // --- Add Feedback ---
  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackDescription.trim()) return;
    setFeedbackLoading(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/feedback`, {
        method: "POST",
        body: JSON.stringify({
          type: feedbackType,
          priority: feedbackPriority,
          timestamp: feedbackTimestamp,
          description: feedbackDescription.trim(),
        }),
      });
      if (res.ok) {
        setShowFeedbackForm(false);
        setFeedbackDescription("");
        setFeedbackTimestamp("");
        setFeedbackType("Revision");
        setFeedbackPriority("Medium");
        await fetchProject();
      }
    } catch {
      // silently fail
    } finally {
      setFeedbackLoading(false);
    }
  };

  // --- Resolve Feedback ---
  const handleResolveFeedback = async (feedbackId: string) => {
    try {
      const res = await apiFetch(`/api/feedback/${feedbackId}/resolve`, {
        method: "PATCH",
      });
      if (res.ok) {
        await fetchProject();
      }
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg
          className="animate-spin h-6 w-6 text-text-tertiary"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-sm text-error">{error || "Project not found"}</p>
        <button
          onClick={() => router.push("/dashboard/projects")}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const openFeedback = project.feedback.filter((f) => f.status === "open");
  const resolvedFeedback = project.feedback.filter(
    (f) => f.status === "resolved"
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/projects")}
        className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Projects
      </button>

      {/* Top Section: Title + Status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {project.title}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Status */}
        <div className="relative">
          {isClient ? (
            <>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={statusLoading}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                  statusColors[project.status] || ""
                }`}
              >
                {statusLoading
                  ? "Updating..."
                  : project.status.charAt(0).toUpperCase() +
                    project.status.slice(1)}
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-border rounded-lg py-1 z-20 min-w-[140px] shadow-lg">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                        s === project.status
                          ? "text-text-primary bg-bg-tertiary"
                          : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <span
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                statusColors[project.status] || ""
              }`}
            >
              {project.status.charAt(0).toUpperCase() +
                project.status.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
            activeTab === "overview"
              ? "text-text-primary border-accent"
              : "text-text-tertiary border-transparent hover:text-text-secondary"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "feedback"
              ? "text-text-primary border-accent"
              : "text-text-tertiary border-transparent hover:text-text-secondary"
          }`}
        >
          Feedback
          {openFeedback.length > 0 && (
            <span className="text-[10px] bg-error/15 text-error px-1.5 py-0.5 rounded-full font-medium">
              {openFeedback.length}
            </span>
          )}
        </button>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-bg-secondary border border-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-text-primary mb-3">
                Description
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {project.description || "No description provided."}
              </p>
            </div>

            {/* Deadline */}
            {project.deadline && (
              <div className="bg-bg-secondary border border-border rounded-xl p-5">
                <h3 className="text-sm font-medium text-text-primary mb-2">
                  Deadline
                </h3>
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

            {/* Versions */}
            <div className="bg-bg-secondary border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-primary">
                  Versions
                </h3>
                <button
                  onClick={() => setShowVersionForm(!showVersionForm)}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  + New Version
                </button>
              </div>

              {showVersionForm && (
                <div className="mb-4 p-3 bg-bg-tertiary border border-border rounded-lg space-y-3">
                  <textarea
                    value={versionNotes}
                    onChange={(e) => setVersionNotes(e.target.value)}
                    placeholder="Version notes (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowVersionForm(false)}
                      className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateVersion}
                      disabled={versionLoading}
                      className="px-3 py-1.5 text-xs bg-accent text-bg rounded-lg font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {versionLoading ? "Creating..." : "Create Version"}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {project.versions.map((v) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      v.id === project.current_version_id
                        ? "bg-bg-tertiary border border-border"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {v.version_name}
                      </span>
                      {v.id === project.current_version_id && (
                        <span className="text-[10px] bg-success/15 text-success px-1.5 py-0.5 rounded-full font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-tertiary">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Team */}
          <div className="space-y-6">
            <div className="bg-bg-secondary border border-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-text-primary mb-4">
                Team Members
              </h3>
              <div className="space-y-3">
                {project.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-text-secondary">
                        {m.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-text-tertiary capitalize">
                        {m.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-medium text-text-primary mb-2">
                Quick Stats
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">Versions</span>
                <span className="text-sm font-medium text-text-primary">
                  {project.versions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">
                  Open Feedback
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {openFeedback.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">
                  Resolved Feedback
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {resolvedFeedback.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">Members</span>
                <span className="text-sm font-medium text-text-primary">
                  {project.members.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FEEDBACK TAB --- */}
      {activeTab === "feedback" && (
        <div className="space-y-6">
          {/* Add Feedback (Client only) */}
          {isClient && (
            <div>
              {!showFeedbackForm ? (
                <button
                  onClick={() => setShowFeedbackForm(true)}
                  className="px-4 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  + Add Feedback
                </button>
              ) : (
                <div className="bg-bg-secondary border border-border rounded-xl p-5">
                  <h3 className="text-sm font-medium text-text-primary mb-4">
                    Add Feedback
                    {project.currentVersion && (
                      <span className="ml-2 text-xs font-normal text-text-tertiary">
                        ({project.currentVersion.version_name})
                      </span>
                    )}
                  </h3>
                  <form onSubmit={handleAddFeedback} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Type */}
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">
                          Type
                        </label>
                        <select
                          value={feedbackType}
                          onChange={(e) => setFeedbackType(e.target.value)}
                          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-border-hover transition-colors [color-scheme:dark]"
                        >
                          <option value="Revision">Revision</option>
                          <option value="Bug">Bug</option>
                          <option value="Enhancement">Enhancement</option>
                          <option value="General">General</option>
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">
                          Priority
                        </label>
                        <select
                          value={feedbackPriority}
                          onChange={(e) =>
                            setFeedbackPriority(e.target.value)
                          }
                          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-border-hover transition-colors [color-scheme:dark]"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>

                      {/* Timestamp */}
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">
                          Timestamp
                        </label>
                        <input
                          type="text"
                          value={feedbackTimestamp}
                          onChange={(e) =>
                            setFeedbackTimestamp(e.target.value)
                          }
                          placeholder="e.g. 00:45"
                          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Description <span className="text-error">*</span>
                      </label>
                      <textarea
                        value={feedbackDescription}
                        onChange={(e) =>
                          setFeedbackDescription(e.target.value)
                        }
                        placeholder="Describe the feedback..."
                        rows={3}
                        className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFeedbackForm(false)}
                        className="px-4 py-2 text-sm text-text-secondary border border-border rounded-lg hover:border-border-hover hover:text-text-primary transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          feedbackLoading || !feedbackDescription.trim()
                        }
                        className="px-4 py-2 text-sm bg-accent text-bg rounded-lg font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {feedbackLoading ? "Submitting..." : "Submit Feedback"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Feedback List */}
          {project.feedback.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-xl flex flex-col items-center justify-center py-16">
              <p className="text-sm text-text-tertiary">
                No feedback yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.feedback.map((fb) => (
                <div
                  key={fb.id}
                  className={`bg-bg-secondary border rounded-xl p-4 ${
                    fb.status === "resolved"
                      ? "border-border/50 opacity-70"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 bg-bg-tertiary border border-border rounded-full text-text-secondary">
                        {fb.type}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          priorityColors[fb.priority] || ""
                        }`}
                      >
                        {fb.priority}
                      </span>
                      {fb.timestamp && (
                        <span className="text-xs text-text-tertiary">
                          @ {fb.timestamp}
                        </span>
                      )}
                      <span className="text-xs text-text-tertiary">
                        {fb.version_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {fb.status === "open" ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                          Open
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/15 text-success">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-text-primary mb-2">
                    {fb.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-tertiary">
                      {fb.created_by_name} &middot;{" "}
                      {new Date(fb.created_at).toLocaleDateString()}
                    </p>
                    {isFreelancer && fb.status === "open" && (
                      <button
                        onClick={() => handleResolveFeedback(fb.id)}
                        className="text-xs text-success hover:text-success/80 transition-colors cursor-pointer font-medium"
                      >
                        Mark Resolved
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
