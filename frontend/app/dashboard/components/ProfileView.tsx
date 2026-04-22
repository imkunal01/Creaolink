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

function statusTone(status: string) {
  if (status === "pending") return "bg-amber-500/15 text-amber-300";
  if (status === "completed" || status === "approved") return "bg-slate-500/15 text-slate-300";
  return "bg-emerald-500/15 text-emerald-300";
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
        if (!cancelled) {
          setData(nextData);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
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
      if (nextFollowing) {
        await apiFollowUser(userId);
      } else {
        await apiUnfollowUser(userId);
      }
    } catch (err) {
      setData((current) =>
        current
          ? {
              ...current,
              isFollowing: !nextFollowing,
              isMutual: current.isMutual,
              followers: current.followers + (nextFollowing ? -1 : 1),
            }
          : current
      );
      setError(err instanceof Error ? err.message : "Unable to update follow state");
    } finally {
      setFollowPending(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[28px] border border-[#30363d] bg-[#0d1117] px-6 py-16 text-center text-sm text-[#8b949e]">
        Loading profile...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 px-6 py-6 text-sm text-red-200">
        {error || "Profile not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[30px] border border-[#30363d] bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(88,166,255,0.18),_transparent_38%),linear-gradient(135deg,_#111827,_#0d1117_58%,_#010409)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 text-2xl font-semibold text-[#f0f6fc] backdrop-blur-sm">
              {initials(data.profile.name)}
            </div>
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-[#f0f6fc]">{data.profile.name}</h1>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-[#9fb3c8]">
                  {data.profile.role}
                </span>
                {data.isMutual && !isCurrentUser && (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200">
                    Mutual connection
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-[#8b949e]">
                {isCurrentUser ? "Your public profile" : data.profile.headline}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c9d1d9]">{data.profile.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#dbe8f5]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3">
            {!isCurrentUser && (
              <button
                onClick={handleFollowToggle}
                disabled={followPending}
                className={`w-full rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                  data.isFollowing
                    ? "border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] hover:border-[#58a6ff]/40"
                    : "border border-[#1f6feb] bg-[#1f6feb] text-white hover:bg-[#388bfd]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {followPending ? "Updating..." : data.isFollowing ? "Following" : "Follow user"}
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Followers" value={data.followers} />
              <StatCard label="Following" value={data.following} />
              <StatCard label="Public projects" value={data.portfolio.length} />
              <StatCard label="Reputation" value={data.reputation} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-[#30363d] bg-[#0d1117] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8b949e]">Contribution graph</p>
                <h2 className="mt-2 text-xl font-semibold text-[#f0f6fc]">Activity rhythm</h2>
              </div>
              <span className="rounded-full border border-[#30363d] px-3 py-1 text-xs text-[#8b949e]">
                12 week view
              </span>
            </div>

            <div className="mt-6 grid grid-cols-12 gap-2">
              {data.activityGraph.map((item) => (
                <div key={item.week} className="flex flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end rounded-2xl border border-[#21262d] bg-[#010409] p-2">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-[#1f6feb] via-[#58a6ff] to-[#7ee787]"
                      style={{ height: `${Math.max(12, item.contributions * 12)}px` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#6e7681]">W{item.week}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#30363d] bg-[#0d1117] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8b949e]">Portfolio</p>
                <h2 className="mt-2 text-xl font-semibold text-[#f0f6fc]">Public projects</h2>
              </div>
              <span className="rounded-full border border-[#30363d] px-3 py-1 text-xs text-[#8b949e]">
                {data.portfolio.length} visible
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {data.portfolio.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#30363d] bg-[#010409]/40 px-4 py-8 text-sm text-[#6e7681]">
                  No public projects yet. As soon as this user shares public workspaces, they will appear here.
                </div>
              ) : (
                data.portfolio.map((project) => (
                  <div key={project.id} className="rounded-2xl border border-[#21262d] bg-[#010409]/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#f0f6fc]">{project.title}</p>
                      <span className={`rounded-full px-2 py-1 text-[11px] ${statusTone(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#8b949e]">
                      {project.description || "A public case study that is part of this creator's portfolio."}
                    </p>
                    <p className="mt-4 text-xs text-[#6e7681]">Updated {new Date(project.updated_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[24px] border border-[#30363d] bg-[#0d1117] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8b949e]">Connections</p>
            <h2 className="mt-2 text-xl font-semibold text-[#f0f6fc]">Followers</h2>
            <div className="mt-5 space-y-3">
              {data.followersList.length === 0 ? (
                <ConnectionEmpty copy="No followers yet." />
              ) : (
                data.followersList.map((person) => <ConnectionRow key={person.id} person={person} />)
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#30363d] bg-[#0d1117] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8b949e]">Connections</p>
            <h2 className="mt-2 text-xl font-semibold text-[#f0f6fc]">Following</h2>
            <div className="mt-5 space-y-3">
              {data.followingList.length === 0 ? (
                <ConnectionEmpty copy="This user is not following anyone yet." />
              ) : (
                data.followingList.map((person) => <ConnectionRow key={person.id} person={person} />)
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#30363d] bg-[#0d1117] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8b949e]">Profile visibility</p>
            <h2 className="mt-2 text-xl font-semibold text-[#f0f6fc]">Public sharing status</h2>
            <p className="mt-4 text-sm leading-7 text-[#8b949e]">
              This profile is currently visible to the workspace community so followers can discover public portfolio items,
              reputation, and contribution trends.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8b949e]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#f0f6fc]">{value}</p>
    </div>
  );
}

function ConnectionRow({ person }: { person: UserListItem }) {
  return (
    <Link
      href={`/dashboard/profile/${person.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-[#21262d] bg-[#010409]/80 px-4 py-3 transition-colors hover:border-[#58a6ff]/50"
    >
      <div>
        <p className="text-sm font-medium text-[#f0f6fc]">{person.name}</p>
        <p className="mt-1 text-xs capitalize text-[#8b949e]">{person.role}</p>
      </div>
      <span className="text-xs text-[#79c0ff]">Open</span>
    </Link>
  );
}

function ConnectionEmpty({ copy }: { copy: string }) {
  return <div className="rounded-2xl border border-dashed border-[#30363d] bg-[#010409]/40 px-4 py-6 text-sm text-[#6e7681]">{copy}</div>;
}
