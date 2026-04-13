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
  active: "bg-emerald-400/15 text-emerald-300",
  completed: "bg-slate-400/15 text-slate-300",
  pending: "bg-amber-400/15 text-amber-300",
};

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-md border border-[#30363d] bg-[#161b22] p-4 text-left transition-all duration-200 hover:border-[#58a6ff]/50 hover:bg-[#1b2230] cursor-pointer"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#58a6ff] transition-colors group-hover:text-[#79c0ff] sm:text-base">
          {project.name}
        </h3>
        <span
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${
            statusColors[project.status]
          }`}
        >
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>

      {project.description && (
        <p className="mb-3 line-clamp-2 text-sm text-[#8b949e]">
          {project.description}
        </p>
      )}

      <p className="text-xs text-[#8b949e]">
        Updated {project.updatedAt}
      </p>
    </button>
  );
}
