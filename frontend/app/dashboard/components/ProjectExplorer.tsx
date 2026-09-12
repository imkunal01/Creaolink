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
  active: "#00e5ff",
  pending: "#f59e0b",
  completed: "#10b981",
  approved: "#10b981",
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

  return (
    <aside className="cl-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] bg-[#0d0e10]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white">Project Explorer</span>
          <span className="tag tag-n text-[10px] font-mono">{projects.length} Total</span>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter workspaces..."
          className="w-full h-8 px-2.5 rounded-md bg-[#141618] border border-white/[0.08] text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00e5ff]/60 transition-colors"
        />

        <div className="grid grid-cols-2 gap-2 mt-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortValue)}
            className="w-full h-8 px-2 rounded-md bg-[#141618] border border-white/[0.08] text-[11px] text-zinc-300 outline-none cursor-pointer [color-scheme:dark]"
          >
            <option value="recent">Recent</option>
            <option value="alphabetical">A to Z</option>
            <option value="status">By Status</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterValue)}
            className="w-full h-8 px-2 rounded-md bg-[#141618] border border-white/[0.08] text-[11px] text-zinc-300 outline-none cursor-pointer [color-scheme:dark]"
          >
            <option value="all">All States</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Sections */}
      <div className="max-h-[60vh] overflow-y-auto p-3 space-y-3">
        <ProjectSection
          title="Pinned"
          description="Quick access favorites"
          count={pinnedProjects.length}
          collapsed={collapsed.pinned}
          onToggle={() => setCollapsed((c) => ({ ...c, pinned: !c.pinned }))}
        >
          {pinnedProjects.length === 0 ? (
            <ExplorerEmptyText text="Pin projects to save them for quick access." />
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
              group === "active" ? "Currently in active review" :
              group === "draft" ? "Pending kickoff" :
              "Shipped and archived"
            }
            count={groupedProjects[group].length}
            collapsed={collapsed[group]}
            onToggle={() => setCollapsed((c) => ({ ...c, [group]: !c[group] }))}
          >
            {groupedProjects[group].length === 0 ? (
              <ExplorerEmptyText text={`No ${groupLabel(group).toLowerCase()} projects match filter.`} />
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
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-1.5 text-left cursor-pointer rounded hover:bg-white/[0.04] transition-colors"
      >
        <div>
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
            {title}
          </div>
          <div className="text-[10px] text-zinc-500">{description}</div>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px]">
          <span className="px-1.5 py-0.2 rounded bg-[#1c1e22] border border-white/[0.06]">{count}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-150 ${collapsed ? "rotate-180" : ""}`}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="mt-1.5 space-y-1.5 pl-1">
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
    <div className={`group rounded-md border p-2.5 transition-all ${
      isActive
        ? "bg-[#00e5ff]/10 border-[#00e5ff]/30"
        : "bg-[#141618] border-white/[0.06] hover:border-white/[0.14]"
    }`}>
      <div className="flex items-start gap-2.5">
        <button onClick={onOpen} className="flex min-w-0 flex-1 gap-2 text-left cursor-pointer">
          <span
            className="mt-1 h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-white truncate">
                {project.title}
              </span>
              {isPinned && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-[#00e5ff] shrink-0">
                  <path d="M16 3H8l2 6-4 4v2h7v6l1 1 1-1v-6h7v-2l-4-4 2-6z" />
                </svg>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
              {project.description || "No description provided."}
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-zinc-500">
              <span className="truncate max-w-[90px]">{project.owner_name}</span>
              <span>&middot; {project.member_count} members</span>
              {project.open_feedback > 0 && (
                <span className="text-[#00e5ff] font-medium">&middot; {project.open_feedback} open</span>
              )}
            </div>
          </div>
        </button>

        {/* Context menu */}
        <div className="relative shrink-0">
          <button
            onClick={onMenuToggle}
            className="flex h-6 w-6 items-center justify-center rounded bg-[#1c1e22] border border-white/[0.06] text-zinc-400 hover:text-white cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-40 w-36 rounded-md border border-white/[0.1] bg-[#141618] p-1 shadow-2xl">
              {[
                { label: isPinned ? "Unpin Room" : "Pin Room", action: onPinToggle },
                onArchive ? { label: "Archive Room", action: onArchive } : null,
                { label: "Open Settings", action: onOpen },
              ].filter(Boolean).map((item) => (
                <button
                  key={item!.label}
                  onClick={item!.action}
                  className="block w-full px-2.5 py-1.5 text-left text-xs text-zinc-300 hover:bg-[#1c1e22] hover:text-white rounded transition-colors cursor-pointer"
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
    <div className="p-3 border border-dashed border-white/[0.08] rounded-md text-[11px] font-mono text-zinc-500 leading-relaxed text-center">
      {text}
    </div>
  );
}
