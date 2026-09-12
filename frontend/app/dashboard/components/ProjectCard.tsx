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

function statusTag(status: Project["status"]) {
  if (status === "active") return <span className="tag tag-a">Active</span>;
  if (status === "pending") return <span className="tag tag-r">In Review</span>;
  return <span className="tag tag-d">Approved</span>;
}

const progressMap: Record<Project["status"], number> = {
  active: 40,
  pending: 75,
  completed: 100,
};

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const progress = progressMap[project.status] ?? 40;

  return (
    <button
      onClick={onClick}
      className="proj-card w-full text-left"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="proj-card-title truncate">{project.name}</div>
        {statusTag(project.status)}
      </div>

      {project.description && (
        <div className="proj-card-desc">{project.description}</div>
      )}

      {/* Progress */}
      <div className="proj-card-prog-lbl">
        <span>Timeline Delivery</span>
        <span className="font-mono">{progress}%</span>
      </div>
      <div className="proj-card-prog-bar">
        <div className="proj-card-prog-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 font-mono text-[9px] font-bold text-white">
            {project.name.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-[11px] font-mono text-neutral-400">Workspace</span>
        </div>
        <span className="text-[11px] font-mono text-neutral-500">
          {project.updatedAt}
        </span>
      </div>
    </button>
  );
}
