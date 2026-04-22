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

const statusAccent: Record<ProjectStatus, string> = {
  active: "bg-emerald-400",
  pending: "bg-amber-400",
  completed: "bg-slate-400",
  approved: "bg-sky-400",
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
    pinned: false,
    active: false,
    draft: false,
    archived: false,
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
      if (sortBy === "alphabetical") {
        return left.title.localeCompare(right.title);
      }

      if (sortBy === "status") {
        return getProjectGroup(left.status).localeCompare(getProjectGroup(right.status)) ||
          left.title.localeCompare(right.title);
      }

      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    });

    return nextProjects;
  }, [filter, projects, search, sortBy]);

  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const pinnedProjects = filteredProjects.filter((project) => pinnedSet.has(project.id));
  const regularProjects = filteredProjects.filter((project) => !pinnedSet.has(project.id));
  const groupedProjects: Record<Exclude<FilterValue, "all">, ListedProject[]> = {
    active: regularProjects.filter((project) => getProjectGroup(project.status) === "active"),
    draft: regularProjects.filter((project) => getProjectGroup(project.status) === "draft"),
    archived: regularProjects.filter((project) => getProjectGroup(project.status) === "archived"),
  };

  const togglePin = (projectId: string) => {
    setPinnedIds((current) =>
      current.includes(projectId) ? current.filter((item) => item !== projectId) : [projectId, ...current]
    );
    setOpenMenuId(null);
  };

  const sectionClassName = "rounded-2xl border border-[#30363d] bg-[#0d1117]/80 backdrop-blur-sm";

  return (
    <aside className={`${sectionClassName} overflow-hidden`}>
      <div className="border-b border-[#30363d] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#8b949e]">Project Explorer</p>
            <h2 className="mt-1 text-lg font-semibold text-[#f0f6fc]">Workspace tree</h2>
          </div>
          <span className="rounded-full border border-[#30363d] px-2.5 py-1 text-xs text-[#8b949e]">
            {projects.length} total
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects, owners, notes"
            className="w-full rounded-xl border border-[#30363d] bg-[#010409] px-3 py-2.5 text-sm text-[#f0f6fc] placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortValue)}
              className="rounded-xl border border-[#30363d] bg-[#010409] px-3 py-2.5 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none"
            >
              <option value="recent">Sort: Recent</option>
              <option value="alphabetical">Sort: A-Z</option>
              <option value="status">Sort: Status</option>
            </select>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as FilterValue)}
              className="rounded-xl border border-[#30363d] bg-[#010409] px-3 py-2.5 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none"
            >
              <option value="all">All states</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-h-[60vh] space-y-4 overflow-y-auto px-3 py-4">
        <ProjectSection
          title="Pinned"
          description="Fast access to projects you revisit often."
          count={pinnedProjects.length}
          collapsed={collapsed.pinned}
          onToggle={() => setCollapsed((current) => ({ ...current, pinned: !current.pinned }))}
        >
          {pinnedProjects.length === 0 ? (
            <EmptyStateCopy text="Pin projects from the quick actions menu to keep them within reach." />
          ) : (
            pinnedProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                isActive={project.id === currentProjectId}
                isPinned
                menuOpen={openMenuId === project.id}
                onMenuToggle={() => setOpenMenuId((current) => (current === project.id ? null : project.id))}
                onOpen={() => onProjectOpen(project.id)}
                onPinToggle={() => togglePin(project.id)}
                onArchive={
                  onArchiveProject && getProjectGroup(project.status) !== "archived"
                    ? () => onArchiveProject(project.id)
                    : undefined
                }
              />
            ))
          )}
        </ProjectSection>

        {(["active", "draft", "archived"] as const).map((group) => (
          <ProjectSection
            key={group}
            title={groupLabel(group)}
            description={
              group === "active"
                ? "Projects currently moving with collaborators."
                : group === "draft"
                ? "Early-stage workspaces waiting on review or kickoff."
                : "Shipped, approved, or archived spaces."
            }
            count={groupedProjects[group].length}
            collapsed={collapsed[group]}
            onToggle={() => setCollapsed((current) => ({ ...current, [group]: !current[group] }))}
          >
            {groupedProjects[group].length === 0 ? (
              <EmptyStateCopy text={`No ${groupLabel(group).toLowerCase()} projects match this filter.`} />
            ) : (
              groupedProjects[group].map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  isActive={project.id === currentProjectId}
                  isPinned={pinnedSet.has(project.id)}
                  menuOpen={openMenuId === project.id}
                  onMenuToggle={() => setOpenMenuId((current) => (current === project.id ? null : project.id))}
                  onOpen={() => onProjectOpen(project.id)}
                  onPinToggle={() => togglePin(project.id)}
                  onArchive={
                    onArchiveProject && group !== "archived"
                      ? () => onArchiveProject(project.id)
                      : undefined
                  }
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
  title,
  description,
  count,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#21262d] bg-[#010409]/70 p-3">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-[#f0f6fc]">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#8b949e]">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-[#8b949e]">
          <span className="rounded-full border border-[#30363d] px-2 py-0.5 text-[11px]">{count}</span>
          <span className={`transition-transform ${collapsed ? "rotate-180" : ""}`}>^</span>
        </div>
      </button>

      {!collapsed && <div className="mt-3 space-y-2">{children}</div>}
    </section>
  );
}

function ProjectRow({
  project,
  isActive,
  isPinned,
  menuOpen,
  onMenuToggle,
  onOpen,
  onPinToggle,
  onArchive,
}: {
  project: ListedProject;
  isActive: boolean;
  isPinned: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onOpen: () => void;
  onPinToggle: () => void;
  onArchive?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        isActive
          ? "border-[#58a6ff] bg-[#0f1f35]"
          : "border-[#30363d] bg-[#0d1117] hover:border-[#58a6ff]/40 hover:bg-[#111827]"
      }`}
    >
      <div className="flex items-start gap-3">
        <button onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${statusAccent[project.status]}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-[#f0f6fc]">{project.title}</p>
              {isPinned && <span className="text-xs text-[#79c0ff]">Pinned</span>}
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#8b949e]">
              {project.description || "No description yet."}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8b949e]">
              <span>{project.owner_name}</span>
              <span>{project.member_count} collaborators</span>
              <span>{project.open_feedback} open feedback</span>
            </div>
          </div>
        </button>

        <div className="relative">
          <button
            onClick={onMenuToggle}
            className="rounded-lg border border-[#30363d] px-2 py-1 text-xs text-[#8b949e] hover:border-[#58a6ff]/40 hover:text-[#f0f6fc]"
          >
            ...
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-36 rounded-xl border border-[#30363d] bg-[#0d1117] p-1 shadow-2xl shadow-black/30">
              <button
                onClick={onPinToggle}
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-[#c9d1d9] hover:bg-[#161b22]"
              >
                {isPinned ? "Unpin project" : "Pin project"}
              </button>
              {onArchive && (
                <button
                  onClick={onArchive}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs text-[#c9d1d9] hover:bg-[#161b22]"
                >
                  Archive project
                </button>
              )}
              <button
                onClick={onOpen}
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-[#c9d1d9] hover:bg-[#161b22]"
              >
                Open settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyStateCopy({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-[#30363d] px-3 py-4 text-xs leading-relaxed text-[#6e7681]">{text}</p>;
}
