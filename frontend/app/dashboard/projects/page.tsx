"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import CreateProjectModal from "../components/CreateProjectModal";
import EmptyState from "../components/EmptyState";

interface ApiProject {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "approved" | "paused";
  created_at: string;
}

function statusTag(status: string) {
  if (status === "active" || status === "approved")
    return <span className="tag tag-a">Active</span>;
  if (status === "paused")
    return <span className="tag tag-r">In Review</span>;
  return <span className="tag tag-d">Approved</span>;
}

const STATUS_FILTERS = ["All", "Active", "Review", "Done"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function matchesFilter(project: ApiProject, filter: StatusFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Active") return project.status === "active" || project.status === "approved";
  if (filter === "Review") return project.status === "paused";
  if (filter === "Done") return project.status === "completed";
  return true;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiFetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUser(getUser());
    fetchProjects();
  }, [fetchProjects]);

  if (!user) return null;

  const isClient = user.role === "client" || user.role === "admin";

  const filtered = projects.filter(
    (p) =>
      matchesFilter(p, activeFilter) &&
      (search.trim() === "" || p.title.toLowerCase().includes(search.toLowerCase()))
  );

  const countFor = (f: StatusFilter) =>
    projects.filter((p) => matchesFilter(p, f)).length;

  return (
    <div className="mc pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Project Workspaces
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isClient ? "Manage deliverable rooms and timeline sync" : "Assigned client sequences and review rooms"}
          </p>
        </div>
        {isClient && (
          <button className="btn btn-p" onClick={() => setShowCreateModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project Room
          </button>
        )}
      </div>

      {/* Filter bar & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0d0e10] border border-white/[0.08]">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeFilter === f
                  ? "bg-[#1c1e22] text-white border border-white/10"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>{f}</span>
              <span className="text-[10px] opacity-70">
                {countFor(f)}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-[#141618] border border-white/[0.08] text-xs text-white w-full sm:w-64">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces..."
            className="w-full bg-transparent placeholder:text-zinc-600 outline-none text-xs"
          />
        </div>
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#00e5ff] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="cl-card">
          <EmptyState
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            }
            title={search ? "No matching workspaces" : isClient ? "No project rooms yet" : "No assigned workspaces"}
            description={
              isClient
                ? "Create your first project room to start collaborating with freelancers and editors."
                : "When a studio or client invites you, your workspace will appear here."
            }
            action={isClient ? { label: "Create Project Room", onClick: () => setShowCreateModal(true) } : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const progress = project.status === "completed" || project.status === "approved" ? 100 :
              project.status === "paused" ? 75 : 40;

            return (
              <div
                key={project.id}
                className="proj-card group"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="proj-card-title truncate">{project.title}</div>
                  {statusTag(project.status)}
                </div>

                <div className="proj-card-desc">
                  {project.description || "No description provided."}
                </div>

                {/* Progress */}
                <div className="proj-card-prog-lbl">
                  <span>Timeline Delivery</span>
                  <span>{progress}%</span>
                </div>
                <div className="proj-card-prog-bar">
                  <div className="proj-card-prog-fill" style={{ width: `${progress}%` }} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-[#00e5ff]/15 text-[#00e5ff] font-bold text-[9px]">
                      {project.title.slice(0, 2).toUpperCase()}
                    </div>
                    <span>Workspace</span>
                  </div>
                  <span>
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {isClient && (
        <CreateProjectModal
          open={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
