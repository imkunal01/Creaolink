"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import StatsCards from "./StatsCards";
import EmptyState from "./EmptyState";
import ProjectCard from "./ProjectCard";
import CreateProjectModal from "./CreateProjectModal";

import { useProjects } from "@/lib/hooks/use-projects";

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
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#00e5ff] animate-spin" />
    </div>
  );
}

export default function ClientDashboard({ user }: ClientDashboardProps) {
  const router = useRouter();
  const { projects: rawProjects, isLoading: loading, mutate } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const projects = rawProjects as unknown as ApiProject[];

  const activeCount = projects.filter((p) => p.status === "active").length;
  const completedCount = projects.filter((p) => p.status === "completed" || p.status === "approved").length;
  const pendingFeedback = projects.reduce((sum, p) => sum + (p.openFeedback || 0), 0);

  const clientStats = [
    { label: "Active Review Rooms", value: activeCount },
    { label: "Delivered & Approved", value: completedCount },
    { label: "Pending Resolution", value: pendingFeedback, accent: pendingFeedback > 0 },
  ];

  return (
    <div className="mc pb-10">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Workspace Overview
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Logged in as <span className="text-zinc-200 font-medium">{user.name}</span> &middot; Client Studio
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-p">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Project Room
        </button>
      </div>

      {/* KPI Stats */}
      <StatsCards stats={clientStats} />

      {/* Projects grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Active Review Workspaces
          </h2>
          {projects.length > 0 && (
            <span className="text-[11px] font-mono text-zinc-500">
              {projects.length} {projects.length === 1 ? "room" : "rooms"}
            </span>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : projects.length === 0 ? (
          <div className="cl-card">
            <EmptyState
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="M3 7V5a2 2 0 0 1 2-2h4" />
                  <path d="M3 17v2a2 2 0 0 0 2 2h4" />
                  <path d="M13 7l-4 5 4 5" />
                  <line x1="9" y1="12" x2="21" y2="12" />
                </svg>
              }
              title="No active workspaces"
              description="Create a project room to invite video editors, sync timelines from Premiere Pro, and resolve client feedback."
              action={{ label: "Create First Room", onClick: () => setShowCreateModal(true) }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
        onClose={() => { setShowCreateModal(false); mutate(); }}
      />
    </div>
  );
}
