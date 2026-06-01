"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import StatsCards from "./StatsCards";
import EmptyState from "./EmptyState";
import ProjectCard from "./ProjectCard";

interface ApiProject {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: "active" | "completed" | "approved" | "paused";
  created_at: string;
  openFeedback: number;
}

interface FreelancerDashboardProps {
  user: User;
}

export default function FreelancerDashboard({ user }: FreelancerDashboardProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);

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

  const assignedCount = projects.filter((p) => p.status === "active").length;
  const openFeedback = projects.reduce((sum, p) => sum + (p.openFeedback || 0), 0);
  const completedCount = projects.filter((p) => p.status === "completed" || p.status === "approved").length;

  const freelancerStats = [
    { label: "Assigned Projects", value: assignedCount },
    { label: "Open Feedback", value: openFeedback, accent: openFeedback > 0 },
    { label: "Completed", value: completedCount },
  ];

  return (
    <div className="mc" style={{ paddingBottom: "2rem" }}>
      {/* Page header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--fd)", fontSize: "1.3rem", color: "var(--white)", letterSpacing: "-0.02em" }}>
          Overview
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--m1)", marginTop: "0.15rem" }}>
          Welcome back, <span style={{ color: "var(--m2)", fontWeight: 500 }}>{user.name}</span>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={freelancerStats} />

      {/* Assigned Projects */}
      <div style={{ marginTop: "1.5rem" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "0.75rem", paddingBottom: "0.65rem", borderBottom: "1px solid var(--b2)",
        }}>
          <span style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--white)" }}>Assigned Projects</span>
          {projects.length > 0 && (
            <span style={{ fontSize: "0.73rem", color: "var(--m1)" }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              border: "2px solid var(--b2)", borderTopColor: "var(--red)",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        ) : projects.length === 0 ? (
          <div className="cl-card">
            <EmptyState
              icon={
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              }
              title="No projects assigned yet"
              description="When a client adds you to a project, it will appear here. Sit tight — work is on the way."
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
    </div>
  );
}
