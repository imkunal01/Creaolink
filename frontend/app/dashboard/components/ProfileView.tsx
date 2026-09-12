"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getUser } from "@/lib/auth";
import {
  apiFollowUser,
  apiGetUserProfile,
  apiUnfollowUser,
  type UserListItem,
  type UserProfile,
} from "@/lib/api";

interface ProfileViewProps {
  userId: string;
  isCurrentUser?: boolean;
}

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  status: string;
  updated_at: string;
}

interface ProfilePayload {
  profile: UserProfile;
  portfolio: PortfolioProject[];
  followers: number;
  following: number;
  followersList: UserListItem[];
  followingList: UserListItem[];
  reputation: number;
  activityGraph: Array<{ week: number; contributions: number }>;
  skills: string[];
  isFollowing: boolean;
  isMutual: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function statusTag(status: string) {
  if (status === "active") return <span className="tag tag-a">Active</span>;
  if (status === "pending") return <span className="tag tag-r">In Review</span>;
  return <span className="tag tag-d">Approved</span>;
}

export default function ProfileView({ userId, isCurrentUser = false }: ProfileViewProps) {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followPending, setFollowPending] = useState(false);

  useEffect(() => {
    const viewer = getUser();
    setViewerId(viewer?.id ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      try {
        const nextData = await apiGetUserProfile(userId);
        if (!cancelled) { setData(nextData); setError(""); }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [userId]);

  const mutualFollowerExists = useMemo(() => {
    if (!viewerId || !data) return false;
    return data.followersList.some((person) => person.id === viewerId);
  }, [data, viewerId]);

  const handleFollowToggle = async () => {
    if (!data || isCurrentUser || !viewerId) return;
    const nextFollowing = !data.isFollowing;
    setFollowPending(true);
    setData((current) =>
      current
        ? {
            ...current,
            isFollowing: nextFollowing,
            isMutual: nextFollowing ? current.isMutual || mutualFollowerExists : false,
            followers: current.followers + (nextFollowing ? 1 : -1),
          }
        : current
    );
    try {
      if (nextFollowing) await apiFollowUser(userId);
      else await apiUnfollowUser(userId);
    } catch (err) {
      setData((current) =>
        current
          ? { ...current, isFollowing: !nextFollowing, isMutual: current.isMutual, followers: current.followers + (nextFollowing ? -1 : 1) }
          : current
      );
      setError(err instanceof Error ? err.message : "Unable to update follow state");
    } finally {
      setFollowPending(false);
    }
  };

  if (loading) {
    return (
      <div className="mc flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#00e5ff] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mc py-12">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400">
          {error || "Profile not found"}
        </div>
      </div>
    );
  }

  const maxContrib = Math.max(...data.activityGraph.map((i) => i.contributions), 1);

  return (
    <div className="mc pb-12">
      {error && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400 mb-4">
          {error}
        </div>
      )}

      {/* Profile header card */}
      <div className="cl-card mb-6 overflow-hidden">
        {/* Cover */}
        <div className="prof-cover relative bg-gradient-to-r from-[#141618] via-[#1c1e22] to-[#141618] border-b border-white/[0.08] h-32">
          <div className="prof-av-wrap absolute -bottom-10 left-6">
            <div className="prof-av flex h-20 w-20 items-center justify-center rounded-2xl bg-[#00e5ff]/15 border-2 border-[#08090a] font-mono text-xl font-bold text-[#00e5ff] shadow-xl">
              {initials(data.profile.name)}
            </div>
          </div>
        </div>

        {/* Info below cover */}
        <div className="pt-14 p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {data.profile.name}
                </h1>
                <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded bg-[#141618] border border-white/[0.08]">
                  @{data.profile.username}
                </span>
                <span className="tag tag-n text-[10px] uppercase font-mono">
                  {data.profile.role}
                </span>
                {data.isMutual && !isCurrentUser && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    Mutual Connection
                  </span>
                )}
              </div>

              {data.profile.headline && (
                <p className="text-xs text-zinc-400 italic">
                  {isCurrentUser ? "Your public creator portfolio" : data.profile.headline}
                </p>
              )}

              {data.profile.bio && (
                <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                  {data.profile.bio}
                </p>
              )}

              {/* Skills */}
              {data.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {data.skills.map((skill) => (
                    <span key={skill} className="tag tag-n text-[10px] font-mono">{skill}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions + Stats */}
            <div className="flex flex-col gap-3 min-w-[200px]">
              {!isCurrentUser && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followPending}
                  className={`btn btn-lg w-full ${data.isFollowing ? "btn-g" : "btn-p"}`}
                >
                  {followPending ? "Syncing..." : data.isFollowing ? "Following" : "Follow Creator"}
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Followers", value: data.followers },
                  { label: "Following", value: data.following },
                  { label: "Projects", value: data.portfolio.length },
                  { label: "Reputation", value: data.reputation },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-[#141618] border border-white/[0.06] text-center">
                    <div className="text-lg font-bold font-mono text-white">{value}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Graph */}
          <div className="cl-card overflow-hidden">
            <div className="cl-card-head bg-[#0d0e10]">
              <span className="cl-card-title">Sequence & Render Activity</span>
              <span className="text-[11px] font-mono text-zinc-500">12-week telemetry</span>
            </div>
            <div className="p-5">
              <div className="flex items-end justify-between gap-2 h-32 pt-4">
                {data.activityGraph.map((item) => (
                  <div key={item.week} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full bg-[#141618] rounded-t-sm overflow-hidden flex items-end h-full">
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height: `${Math.max(6, (item.contributions / maxContrib) * 100)}%`,
                          background: item.contributions > 0
                            ? `linear-gradient(to top, #00e5ff, rgba(0,229,255,0.4))`
                            : "transparent",
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600">W{item.week}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio */}
          <div className="cl-card overflow-hidden">
            <div className="cl-card-head bg-[#0d0e10]">
              <span className="cl-card-title">Public Reel & Workspaces</span>
              <span className="text-[11px] font-mono text-zinc-500">{data.portfolio.length} projects</span>
            </div>
            <div className="p-4">
              {data.portfolio.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-zinc-500 border border-dashed border-white/[0.08] rounded-lg">
                  No public projects displayed yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {data.portfolio.map((project) => (
                    <div key={project.id} className="p-4 rounded-xl border border-white/[0.08] bg-[#141618] space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xs font-semibold text-white truncate">{project.title}</h3>
                        {statusTag(project.status)}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {project.description || "Public case study deliverable."}
                      </p>
                      <div className="text-[10px] font-mono text-zinc-500 pt-1">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 col */}
        <div className="space-y-6">
          {/* Followers */}
          <div className="cl-card overflow-hidden">
            <div className="cl-card-head bg-[#0d0e10]">
              <span className="cl-card-title">Followers</span>
              <span className="text-[11px] font-mono text-zinc-500">{data.followers}</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {data.followersList.length === 0 ? (
                <div className="p-4 text-xs font-mono text-zinc-500 text-center">No followers yet.</div>
              ) : (
                data.followersList.map((person) => (
                  <Link
                    key={person.id}
                    href={`/dashboard/profile/${person.id}`}
                    className="flex items-center gap-2.5 p-3 hover:bg-[#141618] transition-colors block"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1c1e22] font-mono text-[9px] font-bold text-zinc-300">
                      {person.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white truncate">{person.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500 capitalize">{person.role}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Following */}
          <div className="cl-card overflow-hidden">
            <div className="cl-card-head bg-[#0d0e10]">
              <span className="cl-card-title">Following</span>
              <span className="text-[11px] font-mono text-zinc-500">{data.following}</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {data.followingList.length === 0 ? (
                <div className="p-4 text-xs font-mono text-zinc-500 text-center">Not following anyone yet.</div>
              ) : (
                data.followingList.map((person) => (
                  <Link
                    key={person.id}
                    href={`/dashboard/profile/${person.id}`}
                    className="flex items-center gap-2.5 p-3 hover:bg-[#141618] transition-colors block"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1c1e22] font-mono text-[9px] font-bold text-zinc-300">
                      {person.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white truncate">{person.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500 capitalize">{person.role}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
