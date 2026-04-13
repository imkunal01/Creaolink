"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import EmptyState from "../components/EmptyState";
import ProjectCard from "../components/ProjectCard";
import CreateProjectModal from "../components/CreateProjectModal";

interface ApiProject {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "approved" | "paused";
  created_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
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
    setUser(getUser());
    fetchProjects();
  }, [fetchProjects]);

  if (!user) return null;

  const isClient = user.role === "client" || user.role === "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#f0f6fc]">Projects</h1>
          <p className="mt-1 text-sm text-[#8b949e]">
            {isClient
              ? "Manage and track your projects"
              : "View your assigned projects"}
          </p>
        </div>
        {isClient && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full rounded-md border border-[#238636] bg-[#238636] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[#2ea043] sm:w-auto cursor-pointer"
          >
            New project
          </button>
        )}
      </div>

      {/* Projects list */}
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
            title={isClient ? "No projects yet" : "No projects assigned"}
            description={
              isClient
                ? "Create your first project to start collaborating with freelancers."
                : "When a client adds you to a project, it will show up here."
            }
            action={
              isClient
                ? {
                    label: "Create Project",
                    onClick: () => setShowCreateModal(true),
                  }
                : undefined
            }
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

      {/* Create Project Modal */}
      {isClient && (
        <CreateProjectModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
