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
  if (status === "active") return <span className="tag tag-a">● Active</span>;
  if (status === "pending") return <span className="tag tag-r">⏳ Review</span>;
  return <span className="tag tag-d">✓ Done</span>;
}

const progressMap: Record<Project["status"], number> = {
  active: 40,
  pending: 65,
  completed: 100,
};

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const progress = progressMap[project.status];

  return (
    <button
      onClick={onClick}
      className="proj-card"
      style={{ width: "100%", textAlign: "left", fontFamily: "var(--fb)" }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem",
      }}>
        <div className="proj-card-title">{project.name}</div>
        {statusTag(project.status)}
      </div>

      {project.description && (
        <div className="proj-card-desc">{project.description}</div>
      )}

      {/* Progress */}
      <div className="proj-card-prog-lbl">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <div className="proj-card-prog-bar">
        <div className="proj-card-prog-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginTop: "0.25rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: "var(--red)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "0.5rem", fontWeight: 700, color: "#fff",
          }}>
            {project.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
        <span style={{ fontSize: "0.68rem", color: "var(--m1)" }}>
          {project.updatedAt}
        </span>
      </div>
    </button>
  );
}
