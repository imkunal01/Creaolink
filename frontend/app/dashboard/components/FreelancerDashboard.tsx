"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import StatsCards from "./StatsCards";
import EmptyState from "./EmptyState";
import ProjectCard from "./ProjectCard";

import { useProjects } from "@/lib/hooks/use-projects";

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
  const { projects: rawProjects, isLoading: loading } = useProjects();
  const projects = rawProjects as unknown as ApiProject[];

  const assignedCount = projects.filter((p) => p.status === "active").length;
  const openFeedback = projects.reduce((sum, p) => sum + (p.openFeedback || 0), 0);
  const completedCount = projects.filter((p) => p.status === "completed" || p.status === "approved").length;

  const freelancerStats = [
    { label: "Assigned Workspaces", value: assignedCount },
    { label: "Open Feedback Items", value: openFeedback, accent: openFeedback > 0 },
    { label: "Delivered Sequences", value: completedCount },
  ];

  return (
    <div className="mc pb-10">
      {/* Page header */}
      <div className="mb-6 pb-4 border-b border-white/[0.06]">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Editor Workspace
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Logged in as <span className="text-zinc-200 font-medium">{user.name}</span> &middot; Freelance Editor & Colorist
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={freelancerStats} />

      {/* Assigned Projects */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Assigned Project Workspaces
          </h2>
          {projects.length > 0 && (
            <span className="text-[11px] font-mono text-zinc-500">
              {projects.length} {projects.length === 1 ? "room" : "rooms"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#00e5ff] animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="cl-card">
            <EmptyState
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              title="No assigned workspaces"
              description="When a client or agency adds you to a project room, it will appear here for timeline sync and review."
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
    </div>
  );
}
