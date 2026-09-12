"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, type User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import { apiGetFeed, type FeedActivityItem, type FeedNetworkItem } from "@/lib/api";

interface ProjectRow {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

function statusTag(status: string) {
  if (status === "active")
    return <span className="tag tag-a">Active</span>;
  if (status === "pending")
    return <span className="tag tag-r">In Review</span>;
  return <span className="tag tag-d">Approved</span>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 86400) return "Today";
  if (diff < 172800) return "Yesterday";
  return d.toLocaleDateString();
}

function activityIcon(item: FeedActivityItem) {
  const key = item.status?.toLowerCase() || "create";
  if (key === "version") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#00e5ff]/15 border border-[#00e5ff]/30 text-[#00e5ff] font-mono text-[11px] font-bold">
        v
      </div>
    );
  }
  if (key === "join") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
        +
      </div>
    );
  }
  if (key === "feedback") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold">
        !
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1c1e22] border border-white/[0.08] text-zinc-400 font-mono text-[11px] font-bold">
      *
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activity, setActivity] = useState<FeedActivityItem[]>([]);
  const [network, setNetwork] = useState<FeedNetworkItem[]>([]);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    apiFetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => {})
      .finally(() => setLoadingProjects(false));

    apiGetFeed()
      .then((d) => {
        setActivity(d.activity || []);
        setNetwork(d.network || []);
      })
      .catch(() => {});
  }, [router]);

  if (!user) return null;

  const openFeedback = 0;
  const currentVersion = projects[0] ? "v1.2" : "—";

  return (
    <div className="mc pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Good day, {user.name?.split(" ")[0] || "Editor"}.
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Active review workspaces and sequence telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="btn btn-p btn-sm"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project Room
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-grid mb-6">
        <div className="kpi-card">
          <div className="kpi-num accent">{projects.length}</div>
          <div className="kpi-label">Active Workspaces</div>
          <div className="kpi-trend up font-mono text-[11px] text-zinc-500 mt-2">
            {projects.length} synced
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-num">{openFeedback}</div>
          <div className="kpi-label">Open Feedback</div>
          <div className="kpi-trend font-mono text-[11px] text-zinc-500 mt-2">
            Zero bottlenecks
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-num">{currentVersion}</div>
          <div className="kpi-label">Latest Version</div>
          <div className="kpi-trend font-mono text-[11px] text-zinc-500 mt-2 truncate">
            {projects[0]?.title || "Standby"}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-num">100%</div>
          <div className="kpi-label">Sync Reliability</div>
          <div className="kpi-trend font-mono text-[11px] text-emerald-400 mt-2">
            Premiere Pro online
          </div>
        </div>
      </div>

      {/* Main Grid: Left projects table + Right feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects table */}
          <div className="cl-card overflow-hidden">
            <div className="cl-card-head bg-[#0d0e10]">
              <span className="cl-card-title">Recent Project Rooms</span>
              <Link href="/dashboard/projects" className="text-xs font-mono text-zinc-400 hover:text-white transition-colors">
                View all &rarr;
              </Link>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-white/[0.06] bg-[#0d0e10]/60 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              <span className="col-span-6">Workspace</span>
              <span className="col-span-3">Status</span>
              <span className="col-span-3 text-right">Updated</span>
            </div>

            {loadingProjects ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-500">Loading workspaces...</div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-zinc-400 mb-3">No active project rooms found.</p>
                <button
                  onClick={() => router.push("/dashboard/projects")}
                  className="btn btn-p btn-sm"
                >
                  Create workspace
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {projects.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                    className="w-full grid grid-cols-12 gap-3 px-4 py-3 text-left hover:bg-[#141618] transition-colors items-center cursor-pointer"
                  >
                    <div className="col-span-6 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{p.title}</div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">Premiere Pro timeline connected</div>
                    </div>
                    <div className="col-span-3">
                      {statusTag(p.status)}
                    </div>
                    <div className="col-span-3 text-right text-[11px] font-mono text-zinc-500">
                      {formatDate(p.created_at)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="cl-card overflow-hidden">
            <div className="cl-card-head bg-[#0d0e10]">
              <span className="cl-card-title">Live Activity Stream</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {activity.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-zinc-500">
                  No recent timeline events recorded.
                </div>
              ) : (
                activity.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3.5 hover:bg-[#141618] transition-colors">
                    {activityIcon(item)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 leading-snug">
                        <strong className="text-white font-medium">{item.owner_name}</strong>{" "}
                        {item.title}
                      </p>
                      <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                        {formatDate(item.created_at || new Date().toISOString())}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="cl-card overflow-hidden">
            <div className="cl-card-head bg-[#0d0e10]">
              <span className="cl-card-title">Quick Actions</span>
            </div>
            <div className="p-2 space-y-1">
              {[
                {
                  label: "Open Projects Directory",
                  desc: "Filter and manage workspaces",
                  onClick: () => router.push("/dashboard/projects"),
                },
                {
                  label: "View Portfolio & Profile",
                  desc: "Contributions and public page",
                  onClick: () => router.push("/dashboard/profile"),
                },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="w-full p-2.5 rounded-md text-left hover:bg-[#1c1e22] transition-colors cursor-pointer block group"
                >
                  <div className="text-xs font-medium text-white group-hover:text-[#00e5ff] transition-colors">
                    {action.label}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{action.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Network Connections */}
          <div className="cl-card overflow-hidden">
            <div className="cl-card-head bg-[#0d0e10]">
              <span className="cl-card-title">Network & Collaborators</span>
            </div>
            <div className="p-4">
              {network.length === 0 ? (
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Collaborate on projects to build your shared creative network.
                </p>
              ) : (
                <div className="space-y-3">
                  {network.slice(0, 4).map((person) => (
                    <div key={person.following_id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00e5ff]/15 font-mono text-[10px] font-bold text-[#00e5ff]">
                          {person.name?.slice(0, 2).toUpperCase() || "CR"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">{person.name}</div>
                          <div className="text-[10px] font-mono text-zinc-500">{person.project_count} projects</div>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/profile/${person.following_id}`}
                        className="btn btn-g btn-sm text-[10px]"
                      >
                        Profile
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
