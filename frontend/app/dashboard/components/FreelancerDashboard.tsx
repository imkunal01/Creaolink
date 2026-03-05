"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { apiListProjects } from "@/lib/api";
import StatsCards from "./StatsCards";
import EmptyState from "./EmptyState";
import ProjectCard, { Project } from "./ProjectCard";

interface FreelancerDashboardProps {
  user: User;
}

export default function FreelancerDashboard({ user }: FreelancerDashboardProps) {
  const router = useRouter();
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const { projects: raw } = await apiListProjects();
      setAssignedProjects(
        raw.map((p) => ({
          id: p.id as string,
          name: p.title as string,
          description: (p.description as string) || undefined,
          status: (p.status as "active" | "completed" | "pending") || "active",
          updatedAt: new Date(p.created_at as string).toLocaleDateString(),
        }))
      );
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const activeCount = assignedProjects.filter((p) => p.status === "active").length;
  const completedCount = assignedProjects.filter((p) => p.status === "completed").length;

  const freelancerStats = [
    { label: "Assigned Projects", value: assignedProjects.length },
    { label: "Active", value: activeCount },
    { label: "Completed", value: completedCount },
  ];

  return (
    <div className="space-y-8">
      {/* Header — no primary action button for freelancers */}
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1 truncate">
          Welcome back, {user.name} 👋
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={freelancerStats} />

      {/* Assigned Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text-primary">Assigned Projects</h2>
          {assignedProjects.length > 0 && (
            <span className="text-xs text-text-tertiary">
              {assignedProjects.length} projects
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-text-tertiary border-t-accent rounded-full animate-spin" />
          </div>
        ) : assignedProjects.length === 0 ? (
          <div className="bg-bg-secondary border border-border rounded-xl">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {assignedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
