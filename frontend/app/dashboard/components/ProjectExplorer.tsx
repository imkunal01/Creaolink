"use client";

import { useEffect, useMemo, useState } from "react";
import type { ListedProject, ProjectStatus } from "@/lib/api";

interface ProjectExplorerProps {
  projects: ListedProject[];
  userId: string;
  currentProjectId?: string;
  onProjectOpen: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => Promise<void> | void;
}

type FilterValue = "all" | "active" | "draft" | "archived";
type SortValue = "recent" | "alphabetical" | "status";
type SectionKey = "pinned" | "active" | "draft" | "archived";

const statusDot: Record<ProjectStatus, string> = {
  active: "#4ade80",
  pending: "#fbbf24",
  completed: "var(--m1)",
  approved: "#7dd3fc",
};

function getProjectGroup(status: ProjectStatus): Exclude<FilterValue, "all"> {
  if (status === "pending") return "draft";
  if (status === "completed" || status === "approved") return "archived";
  return "active";
}

function groupLabel(group: Exclude<FilterValue, "all">) {
  if (group === "draft") return "Draft";
  if (group === "archived") return "Archived";
  return "Active";
}

export default function ProjectExplorer({
  projects,
  userId,
  currentProjectId,
  onProjectOpen,
  onArchiveProject,
}: ProjectExplorerProps) {
  const storageKey = `creaolink_pins_${userId}`;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sortBy, setSortBy] = useState<SortValue>("recent");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    pinned: false, active: false, draft: false, archived: false,
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPinnedIds(parsed.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      setPinnedIds([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(pinnedIds));
  }, [pinnedIds, storageKey]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const nextProjects = projects.filter((project) => {
      const group = getProjectGroup(project.status);
      const matchesFilter = filter === "all" || filter === group;
      const haystack = `${project.title} ${project.description} ${project.owner_name}`.toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });

    nextProjects.sort((left, right) => {
      if (sortBy === "alphabetical") return left.title.localeCompare(right.title);
      if (sortBy === "status") {
        return getProjectGroup(left.status).localeCompare(getProjectGroup(right.status)) || left.title.localeCompare(right.title);
      }
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    });
    return nextProjects;
  }, [filter, projects, search, sortBy]);

  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const pinnedProjects = filteredProjects.filter((p) => pinnedSet.has(p.id));
  const regularProjects = filteredProjects.filter((p) => !pinnedSet.has(p.id));
  const groupedProjects: Record<Exclude<FilterValue, "all">, ListedProject[]> = {
    active: regularProjects.filter((p) => getProjectGroup(p.status) === "active"),
    draft: regularProjects.filter((p) => getProjectGroup(p.status) === "draft"),
    archived: regularProjects.filter((p) => getProjectGroup(p.status) === "archived"),
  };

  const togglePin = (projectId: string) => {
    setPinnedIds((current) =>
      current.includes(projectId) ? current.filter((item) => item !== projectId) : [projectId, ...current]
    );
    setOpenMenuId(null);
  };

  const inputStyle = {
    width: "100%", height: 36, padding: "0 10px",
    background: "var(--s3)", border: "1px solid var(--b2)",
    borderRadius: "var(--r)", fontSize: "0.78rem",
    color: "var(--white)", outline: "none", fontFamily: "var(--fb)",
  } as React.CSSProperties;

  return (
    <aside className="cl-card" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "0.9rem 1.1rem", borderBottom: "1px solid var(--b2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.7rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--white)" }}>Project Explorer</span>
          <span className="tag tag-n" style={{ fontSize: "0.65rem" }}>{projects.length} total</span>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          style={inputStyle}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: "0.5rem" }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortValue)}
            style={{ ...inputStyle, colorScheme: "dark", cursor: "pointer" } as React.CSSProperties}
          >
            <option value="recent">Recent</option>
            <option value="alphabetical">A → Z</option>
            <option value="status">By status</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterValue)}
            style={{ ...inputStyle, colorScheme: "dark", cursor: "pointer" } as React.CSSProperties}
          >
            <option value="all">All states</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Sections */}
      <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "0.75rem" }}>
        <ProjectSection
          title="Pinned"
          description="Fast access to revisited projects"
          count={pinnedProjects.length}
          collapsed={collapsed.pinned}
          onToggle={() => setCollapsed((c) => ({ ...c, pinned: !c.pinned }))}
        >
          {pinnedProjects.length === 0 ? (
            <ExplorerEmptyText text="Pin projects from the quick actions menu." />
          ) : (
            pinnedProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                isActive={project.id === currentProjectId}
                isPinned
                menuOpen={openMenuId === project.id}
                onMenuToggle={() => setOpenMenuId((c) => (c === project.id ? null : project.id))}
                onOpen={() => onProjectOpen(project.id)}
                onPinToggle={() => togglePin(project.id)}
                onArchive={onArchiveProject && getProjectGroup(project.status) !== "archived" ? () => onArchiveProject(project.id) : undefined}
                statusColor={statusDot[project.status]}
              />
            ))
          )}
        </ProjectSection>

        {(["active", "draft", "archived"] as const).map((group) => (
          <ProjectSection
            key={group}
            title={groupLabel(group)}
            description={
              group === "active" ? "Currently in progress with collaborators" :
              group === "draft" ? "Waiting on review or kickoff" :
              "Shipped, approved, or archived"
            }
            count={groupedProjects[group].length}
            collapsed={collapsed[group]}
            onToggle={() => setCollapsed((c) => ({ ...c, [group]: !c[group] }))}
          >
            {groupedProjects[group].length === 0 ? (
              <ExplorerEmptyText text={`No ${groupLabel(group).toLowerCase()} projects match this filter.`} />
            ) : (
              groupedProjects[group].map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  isActive={project.id === currentProjectId}
                  isPinned={pinnedSet.has(project.id)}
                  menuOpen={openMenuId === project.id}
                  onMenuToggle={() => setOpenMenuId((c) => (c === project.id ? null : project.id))}
                  onOpen={() => onProjectOpen(project.id)}
                  onPinToggle={() => togglePin(project.id)}
                  onArchive={onArchiveProject && group !== "archived" ? () => onArchiveProject(project.id) : undefined}
                  statusColor={statusDot[project.status]}
                />
              ))
            )}
          </ProjectSection>
        ))}
      </div>
    </aside>
  );
}

function ProjectSection({
  title, description, count, collapsed, onToggle, children,
}: {
  title: string; description: string; count: number;
  collapsed: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "0.6rem" }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex", width: "100%", alignItems: "center",
          justifyContent: "space-between", padding: "0.45rem 0.6rem",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div>
          <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--m2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {title}
          </div>
          <div style={{ fontSize: "0.67rem", color: "var(--m1)", marginTop: "0.1rem" }}>{description}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--m1)", fontSize: "0.68rem" }}>
          <span style={{
            padding: "1px 7px", borderRadius: 99,
            background: "var(--s3)", border: "1px solid var(--b2)",
          }}>{count}</span>
          <span style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s", fontSize: 10 }}>▴</span>
        </div>
      </button>

      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0.2rem 0 0.5rem 0.2rem" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ProjectRow({
  project, isActive, isPinned, menuOpen,
  onMenuToggle, onOpen, onPinToggle, onArchive, statusColor,
}: {
  project: ListedProject; isActive: boolean; isPinned: boolean; menuOpen: boolean;
  onMenuToggle: () => void; onOpen: () => void; onPinToggle: () => void;
  onArchive?: () => void; statusColor: string;
}) {
  return (
    <div style={{
      borderRadius: "var(--r)",
      background: isActive ? "var(--rs)" : "var(--s3)",
      border: `1px solid ${isActive ? "var(--rg)" : "var(--b1)"}`,
      padding: "0.55rem 0.75rem",
      transition: "all 0.12s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <button onClick={onOpen} style={{ display: "flex", minWidth: 0, flex: 1, gap: 8, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <span style={{
            marginTop: 5, width: 7, height: 7, borderRadius: "50%",
            background: statusColor, flexShrink: 0,
          }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.79rem", fontWeight: 500, color: "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {project.title}
              </span>
              {isPinned && <span style={{ fontSize: "0.6rem", color: "var(--red)" }}>📌</span>}
            </div>
            <div style={{ fontSize: "0.67rem", color: "var(--m1)", marginTop: "0.1rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {project.description || "No description yet."}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: "0.35rem", fontSize: "0.63rem", color: "var(--m1)", flexWrap: "wrap" }}>
              <span>{project.owner_name}</span>
              <span>· {project.member_count} people</span>
              {project.open_feedback > 0 && <span style={{ color: "var(--red)" }}>· {project.open_feedback} feedback</span>}
            </div>
          </div>
        </button>

        {/* Context menu */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={onMenuToggle}
            style={{
              width: 24, height: 24, borderRadius: 4,
              background: "var(--s4)", border: "1px solid var(--b2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--m1)", fontSize: 13,
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <div style={{
              position: "absolute", right: 0, top: "100%", zIndex: 30,
              marginTop: 6, width: 150,
              background: "var(--s1)", border: "1px solid var(--b2)",
              borderRadius: "var(--rl)", padding: "0.3rem",
              boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
            }}>
              {[
                { label: isPinned ? "Unpin" : "Pin project", action: onPinToggle },
                onArchive ? { label: "Archive", action: onArchive } : null,
                { label: "Open settings", action: onOpen },
              ].filter(Boolean).map((item) => (
                <button
                  key={item!.label}
                  onClick={item!.action}
                  style={{
                    display: "block", width: "100%", padding: "0.4rem 0.65rem",
                    textAlign: "left", fontSize: "0.76rem", color: "var(--m2)",
                    background: "none", border: "none", cursor: "pointer",
                    borderRadius: 5, transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {item!.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExplorerEmptyText({ text }: { text: string }) {
  return (
    <div style={{
      padding: "0.75rem 0.85rem",
      border: "1px dashed var(--b2)", borderRadius: "var(--r)",
      fontSize: "0.73rem", color: "var(--m1)", lineHeight: 1.55,
    }}>
      {text}
    </div>
  );
}
