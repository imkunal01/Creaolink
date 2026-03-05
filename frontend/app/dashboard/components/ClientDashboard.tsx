"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { apiListProjects } from "@/lib/api";
import StatsCards from "./StatsCards";
import EmptyState from "./EmptyState";
import ProjectCard, { Project } from "./ProjectCard";
import CreateProjectModal from "./CreateProjectModal";

interface ClientDashboardProps {
  user: User;
}

export default function ClientDashboard({ user }: ClientDashboardProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const { projects: raw } = await apiListProjects();
      setProjects(
        raw.map((p) => ({
          id: p.id as string,
          name: p.title as string,
          description: (p.description as string) || undefined,
          status: (p.status as "active" | "completed" | "pending") || "active",
          updatedAt: new Date(p.created_at as string).toLocaleDateString(),
        }))
      );
    } catch {
      // silently fail — show empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const activeCount = projects.filter((p) => p.status === "active").length;
  const completedCount = projects.filter((p) => p.status === "completed").length;

  const clientStats = [
    { label: "Active Projects", value: activeCount },
    { label: "Completed", value: completedCount },
    { label: "Total Projects", value: projects.length },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Welcome back, {user.name} 👋
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="self-start sm:self-auto px-5 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-all duration-200 cursor-pointer shrink-0"
        >
          + Create Project
        </button>
      </div>

      {/* Stats */}
      <StatsCards stats={clientStats} />

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text-primary">My Projects</h2>
          {projects.length > 0 && (
            <span className="text-xs text-text-tertiary">{projects.length} projects</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-text-tertiary border-t-accent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
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
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="M3 7V5a2 2 0 0 1 2-2h4" />
                  <path d="M3 17v2a2 2 0 0 0 2 2h4" />
                  <path d="M13 7l-4 5 4 5" />
                  <line x1="9" y1="12" x2="21" y2="12" />
                </svg>
              }
              title="No projects yet"
              description="Create your first project to get started. Manage deliverables, track progress, and collaborate with freelancers."
              action={{
                label: "Create Project",
                onClick: () => setShowCreate(true),
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          fetchProjects();
        }}
      />
    </div>
  );
}
