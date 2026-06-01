"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import StatsCards from "./StatsCards";
import EmptyState from "./EmptyState";
import ProjectCard from "./ProjectCard";
import CreateProjectModal from "./CreateProjectModal";

interface ApiProject {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: "active" | "completed" | "approved" | "paused";
  current_version_id: string | null;
  current_version_name: string | null;
  created_by: string;
  created_at: string;
  memberCount: number;
  openFeedback: number;
}

interface ClientDashboardProps {
  user: User;
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        border: "2px solid var(--b2)", borderTopColor: "var(--red)",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

export default function ClientDashboard({ user }: ClientDashboardProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiFetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const activeCount = projects.filter((p) => p.status === "active").length;
  const completedCount = projects.filter((p) => p.status === "completed" || p.status === "approved").length;
  const pendingFeedback = projects.reduce((sum, p) => sum + (p.openFeedback || 0), 0);

  const clientStats = [
    { label: "Active Projects", value: activeCount },
    { label: "Completed", value: completedCount },
    { label: "Pending Feedback", value: pendingFeedback, accent: pendingFeedback > 0 },
  ];

  return (
    <div className="mc" style={{ paddingBottom: "2rem" }}>
      {/* Page header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontFamily: "var(--fd)", fontSize: "1.3rem", color: "var(--white)", letterSpacing: "-0.02em" }}>
            Overview
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--m1)", marginTop: "0.15rem" }}>
            Welcome back, <span style={{ color: "var(--m2)", fontWeight: 500 }}>{user.name}</span>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-p">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Project
        </button>
      </div>

      {/* KPI Stats */}
      <StatsCards stats={clientStats} />

      {/* Projects grid */}
      <div style={{ marginTop: "1.5rem" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "0.75rem", paddingBottom: "0.65rem", borderBottom: "1px solid var(--b2)",
        }}>
          <span style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--white)" }}>My Projects</span>
          {projects.length > 0 && (
            <span style={{ fontSize: "0.73rem", color: "var(--m1)" }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : projects.length === 0 ? (
          <div className="cl-card">
            <EmptyState
              icon={
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="M3 7V5a2 2 0 0 1 2-2h4" /><path d="M3 17v2a2 2 0 0 0 2 2h4" />
                  <path d="M13 7l-4 5 4 5" /><line x1="9" y1="12" x2="21" y2="12" />
                </svg>
              }
              title="No projects yet"
              description="Create your first project to get started. Manage deliverables, track progress, and collaborate with freelancers."
              action={{ label: "Create Project", onClick: () => setShowCreateModal(true) }}
            />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.85rem" }}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={{
                  id: project.id,
                  name: project.title,
                  description: project.description,
                  status:
                    project.status === "approved"
                      ? "completed"
                      : project.status === "paused"
                      ? "pending"
                      : project.status,
                  updatedAt: new Date(project.created_at).toLocaleDateString(),
                }}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
