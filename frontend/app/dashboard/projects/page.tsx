"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import { apiListProjects } from "@/lib/api";
import EmptyState from "../components/EmptyState";
import ProjectCard, { type Project } from "../components/ProjectCard";
import CreateProjectModal from "../components/CreateProjectModal";

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Projects</h1>
          <p className="text-sm text-text-secondary mt-1">
            {isClient
              ? "Manage and track your projects"
              : "View your assigned projects"}
          </p>
        </div>
        {isClient && (
          <button
            onClick={() => setShowCreate(true)}
            className="self-start sm:self-auto px-5 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-all duration-200 cursor-pointer shrink-0"
          >
            + Create Project
          </button>
        )}
      </div>

      {/* Projects list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-text-tertiary border-t-accent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-xl">
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
                    onClick: () => setShowCreate(true),
                  }
                : undefined
            }
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

      {/* Create Project Modal */}
      {isClient && (
        <CreateProjectModal
          open={showCreate}
          onClose={() => {
            setShowCreate(false);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
