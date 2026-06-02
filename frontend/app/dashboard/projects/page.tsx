"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import CreateProjectModal from "../components/CreateProjectModal";

interface ApiProject {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "approved" | "paused";
  created_at: string;
}

function statusTag(status: string) {
  if (status === "active" || status === "approved")
    return <span className="tag tag-a">● Active</span>;
  if (status === "paused")
    return <span className="tag tag-r">⏳ Review</span>;
  return <span className="tag tag-d">✓ Done</span>;
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
    <div className="mc">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", gap: "1rem" }}>
        <div>
          <div style={{ fontFamily: "var(--fd)", fontSize: "1.55rem", color: "var(--white)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Projects
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--m2)", marginTop: "0.2rem" }}>
            {isClient ? "Manage and track your projects" : "View your assigned projects"}
          </div>
        </div>
        {isClient && (
          <button className="btn btn-p" onClick={() => setShowCreateModal(true)}>
            + New project
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`filter-chip${activeFilter === f ? " active" : ""}`}
          >
            {f}
            <span style={{
              fontSize: "0.62rem",
              background: "var(--s4)",
              borderRadius: "3px",
              padding: "0 5px",
              color: "var(--m2)",
            }}>
              {countFor(f)}
            </span>
          </button>
        ))}

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "0 11px", height: 34,
          background: "var(--s3)", border: "1px solid var(--b2)", borderRadius: "var(--r)",
          fontSize: "0.79rem", color: "var(--white)", marginLeft: "auto",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--m1)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            style={{
              background: "transparent", border: "none", outline: "none",
              fontSize: "0.79rem", color: "var(--white)", width: 160,
            }}
          />
        </div>
      </div>

      {/* Projects grid */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 0" }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            border: "2px solid var(--b2)", borderTopColor: "var(--red)",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{
            width: 56, height: 56, borderRadius: "var(--rl)",
            background: "var(--s3)", border: "1px solid var(--b2)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--m1)",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--white)" }}>
            {search ? "No matching projects" : isClient ? "No projects yet" : "No projects assigned"}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--m1)", maxWidth: 280, lineHeight: 1.6, textAlign: "center" }}>
            {isClient
              ? "Create your first project to start collaborating with freelancers."
              : "When a client adds you to a project, it will appear here."}
          </div>
          {isClient && (
            <button className="btn btn-p" onClick={() => setShowCreateModal(true)}>
              + Create project
            </button>
          )}
        </div>
      ) : (
        <div className="proj-card-grid">
          {filtered.map((project, i) => {
            const progress = project.status === "completed" || project.status === "approved" ? 100 :
              project.status === "paused" ? 60 : 35;
            const colors = ["#e8392e", "#fbbf24", "#7dd3fc", "#86efac", "#f9a8d4"];
            const dotColor = colors[i % colors.length];

            return (
              <div
                key={project.id}
                className="proj-card"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                  <div>
                    <div className="proj-card-title">{project.title}</div>
                    <div className="proj-card-desc">
                      {project.description || "No description provided."}
                    </div>
                  </div>
                  {statusTag(project.status)}
                </div>

                {/* Progress */}
                <div className="proj-card-prog-lbl">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="proj-card-prog-bar">
                  <div className="proj-card-prog-fill" style={{ width: `${progress}%` }} />
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {/* Avatar stack */}
                  <div style={{ display: "flex" }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      border: "1.5px solid var(--s1)",
                      background: dotColor,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.5rem", fontWeight: 700, color: "#0d0f0e",
                      marginRight: -6,
                    }}>
                      {project.title.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.68rem", color: "var(--m1)" }}>
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
