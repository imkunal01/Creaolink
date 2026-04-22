"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import { apiGetFeed, type FeedActivityItem, type FeedNetworkItem, type FeedPostItem, type FeedProjectItem } from "@/lib/api";

interface ProjectRow {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical" | "status">("recent");

  const [activity, setActivity] = useState<FeedActivityItem[]>([]);
  const [discover, setDiscover] = useState<FeedProjectItem[]>([]);
  const [featured, setFeatured] = useState<FeedProjectItem[]>([]);
  const [posts, setPosts] = useState<FeedPostItem[]>([]);
  const [network, setNetwork] = useState<FeedNetworkItem[]>([]);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    const fetchProjects = async () => {
      try {
        const res = await apiFetch("/api/projects");
        if (!res.ok) return;
        const data = await res.json();
        setProjects(data.projects || []);
      } catch {
        // ignore
      } finally {
        setLoadingProjects(false);
      }
    };

    const fetchFeed = async () => {
      try {
        const data = await apiGetFeed();
        setActivity(data.activity || []);
        setDiscover(data.discover || []);
        setFeatured(data.featured || []);
        setPosts(data.posts || []);
        setNetwork(data.network || []);
      } catch {
        // ignore
      } finally {
        setLoadingFeed(false);
      }
    };

    fetchProjects();
    fetchFeed();
  }, [router]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = projects.filter((project) =>
      q ? project.title.toLowerCase().includes(q) : true
    );

    if (sortBy === "alphabetical") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "status") {
      list = [...list].sort((a, b) => a.status.localeCompare(b.status));
    } else {
      list = [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }

    return list;
  }, [projects, search, sortBy]);

  if (!user) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
      <section className="space-y-4 rounded-xl border border-[#30363d] bg-[#111827] p-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b949e]">Projects</h2>
          <p className="mt-1 text-sm text-[#c9d1d9]">Tree view with quick actions and filters.</p>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search projects"
          className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc]"
        />

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as "recent" | "alphabetical" | "status")}
          className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc]"
        >
          <option value="recent">Sort: Recent</option>
          <option value="alphabetical">Sort: Alphabetical</option>
          <option value="status">Sort: Status</option>
        </select>

        <div className="space-y-2">
          {loadingProjects ? (
            <p className="text-sm text-[#8b949e]">Loading projects...</p>
          ) : filteredProjects.length === 0 ? (
            <p className="rounded-md border border-dashed border-[#30363d] px-3 py-4 text-sm text-[#8b949e]">No projects found.</p>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="rounded-md border border-[#30363d] bg-[#0d1117] p-3">
                <button
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      project.status === "active"
                        ? "bg-emerald-400"
                        : project.status === "pending"
                        ? "bg-amber-400"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="truncate text-sm text-[#f0f6fc]">{project.title}</span>
                </button>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button className="rounded border border-[#30363d] px-2 py-0.5 text-[11px] text-[#8b949e]">Pin</button>
                  <button className="rounded border border-[#30363d] px-2 py-0.5 text-[11px] text-[#8b949e]">Archive</button>
                  <button
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    className="rounded border border-[#30363d] px-2 py-0.5 text-[11px] text-[#8b949e]"
                  >
                    Settings
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b949e]">Activity Feed</h2>
          <div className="mt-3 space-y-2">
            {loadingFeed ? (
              <p className="text-sm text-[#8b949e]">Loading activity...</p>
            ) : activity.length === 0 ? (
              <p className="rounded-md border border-dashed border-[#30363d] px-3 py-4 text-sm text-[#8b949e]">No updates yet.</p>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="rounded-md border border-[#30363d] bg-[#0d1117] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#f0f6fc]">{item.title}</p>
                    <span className="rounded-full bg-[#1f2937] px-2 py-0.5 text-[11px] text-[#8b949e]">{item.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#8b949e]">Updated by {item.owner_name}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b949e]">Discover</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {discover.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-md border border-[#30363d] bg-[#0d1117] p-3">
                <p className="text-sm font-medium text-[#f0f6fc]">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-[#8b949e]">{item.description || "Discover this community project."}</p>
                <p className="mt-2 text-[11px] text-[#6e7681]">Owner: {item.owner_name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b949e]">Project Updates Feed</h2>
          <div className="mt-3 space-y-2">
            {posts.length === 0 ? (
              <p className="rounded-md border border-dashed border-[#30363d] px-3 py-4 text-sm text-[#8b949e]">No posts yet.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="rounded-md border border-[#30363d] bg-[#0d1117] p-3">
                  <p className="text-sm font-medium text-[#f0f6fc]">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-[#8b949e]">{post.content}</p>
                  <p className="mt-2 text-[11px] text-[#6e7681]">{post.author_name} • {post.reactions} likes • {post.comments} comments</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b949e]">Featured Projects</h2>
          <div className="mt-3 space-y-2">
            {featured.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(`/dashboard/projects/${item.id}`)}
                className="w-full rounded-md border border-[#30363d] bg-[#0d1117] p-3 text-left"
              >
                <p className="text-sm text-[#f0f6fc]">{item.title}</p>
                <p className="mt-1 text-[11px] text-[#8b949e]">{item.collaborators || item.member_count || 0} collaborators</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b949e]">Your Network</h2>
          <div className="mt-3 space-y-2">
            {network.length === 0 ? (
              <p className="rounded-md border border-dashed border-[#30363d] px-3 py-4 text-sm text-[#8b949e]">Follow users to build your network stream.</p>
            ) : (
              network.map((person) => (
                <div key={person.following_id} className="rounded-md border border-[#30363d] bg-[#0d1117] p-3">
                  <p className="text-sm text-[#f0f6fc]">{person.name}</p>
                  <p className="mt-1 text-[11px] text-[#8b949e]">{person.project_count} public projects</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
