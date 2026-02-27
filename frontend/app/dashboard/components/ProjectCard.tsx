"use client";

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "pending";
  updatedAt: string;
}

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const statusColors: Record<Project["status"], string> = {
  active: "bg-success/15 text-success",
  completed: "bg-text-tertiary/15 text-text-secondary",
  pending: "bg-amber-500/15 text-amber-400",
};

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-bg-secondary border border-border rounded-xl p-5 hover:border-border-hover transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
          {project.name}
        </h3>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
            statusColors[project.status]
          }`}
        >
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>

      {project.description && (
        <p className="text-sm text-text-tertiary line-clamp-2 mb-3">
          {project.description}
        </p>
      )}

      <p className="text-xs text-text-tertiary">
        Updated {project.updatedAt}
      </p>
    </button>
  );
}
