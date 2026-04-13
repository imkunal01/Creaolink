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
  const openFeedback = projects.reduce(
    (sum, p) => sum + (p.openFeedback || 0),
    0
  );
  const completedCount = projects.filter(
    (p) => p.status === "completed" || p.status === "approved"
  ).length;

  const freelancerStats = [
    { label: "Assigned Projects", value: assignedCount },
    { label: "Open Feedback", value: openFeedback },
    { label: "Completed", value: completedCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header — no primary action button for freelancers */}
      <div>
        <h1 className="text-xl font-semibold text-[#f0f6fc]">Overview</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Welcome back, {user.name}
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={freelancerStats} />

      {/* Assigned Projects Section */}
      <div>
        <div className="mb-3 flex items-center justify-between border-b border-[#30363d] pb-3">
          <h2 className="text-sm font-medium text-[#f0f6fc]">Assigned Projects</h2>
          {projects.length > 0 && (
            <span className="text-xs text-[#8b949e]">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
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
        ) : projects.length === 0 ? (
          <div className="rounded-md border border-[#30363d] bg-[#161b22]">
            <EmptyState
              icon={
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-text-tertiary"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              title="No projects assigned yet"
              description="When a client adds you to a project, it will appear here. Sit tight — work is on the way."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
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
                onClick={() =>
                  router.push(`/dashboard/projects/${project.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
