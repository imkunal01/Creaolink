"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getUser, setUser } from "@/lib/auth";
import {
  apiFollowUser,
  apiGetUserProfile,
  apiUnfollowUser,
  apiUpdateUserProfile,
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
  activityGraph: Record<string, number>;
  skills: string[];
  isFollowing: boolean;
  isMutual: boolean;
}

type TabKey = "overview" | "workspaces" | "pinned" | "followers" | "following";

const AVATAR_PRESETS = [
  {
    name: "Cyber Neon Director",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    name: "Studio Colorist",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  },
  {
    name: "3D Motion Artist",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
  },
  {
    name: "Editorial Lead",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  },
  {
    name: "VFX Supervisor",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
  },
  {
    name: "Audiophile Sound",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
  },
];

const STACK_COLORS: Record<string, { bg: string; dot: string; label: string }> = {
  active: { bg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20", dot: "bg-cyan-400", label: "Active Review" },
  pending: { bg: "bg-amber-500/10 text-amber-300 border-amber-500/20", dot: "bg-amber-400", label: "In Revision" },
  completed: { bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", dot: "bg-emerald-400", label: "Approved Cut" },
  approved: { bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", dot: "bg-emerald-400", label: "Approved Cut" },
};

function initials(name: string) {
  if (!name) return "CL";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "recently";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatJoinDate(dateStr: string) {
  if (!dateStr) return "Joined September 2026";
  try {
    const d = new Date(dateStr);
    return `Joined ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  } catch {
    return "Joined September 2026";
  }
}

export default function ProfileView({ userId, isCurrentUser = false }: ProfileViewProps) {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followPending, setFollowPending] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [copiedLink, setCopiedLink] = useState(false);

  // Search & Filter state for Workspaces tab
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit Profile Details Modal state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    headline: "",
    bio: "",
    company: "",
    location: "",
    website: "",
    status_emoji: "",
    status_text: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar Modal State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const viewer = getUser();
    setViewerId(viewer?.id ?? null);
  }, []);

  const isOwner = useMemo(() => {
    if (isCurrentUser) return true;
    if (viewerId && viewerId === userId) return true;
    return false;
  }, [isCurrentUser, viewerId, userId]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      try {
        const nextData = await apiGetUserProfile(userId);
        if (!cancelled) {
          setData(nextData);
          setError("");
          // populate edit form
          setEditForm({
            name: nextData.profile.name || "",
            headline: nextData.profile.headline || "",
            bio: nextData.profile.bio || "",
            company: nextData.profile.company || "",
            location: nextData.profile.location || "",
            website: nextData.profile.website || "",
            status_emoji: nextData.profile.status_emoji || "🎯",
            status_text: nextData.profile.status_text || "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
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
    if (!data || isOwner || !viewerId) return;
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

  const handleCopyProfile = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleAvatarSelect = async (url: string | null) => {
    if (!isOwner || !data) return;
    setUpdatingAvatar(true);
    try {
      await apiUpdateUserProfile(data.profile.id, { avatar_url: url });
      setData((current) =>
        current
          ? {
              ...current,
              profile: { ...current.profile, avatar_url: url },
            }
          : current
      );

      const currentUser = getUser();
      if (currentUser && currentUser.id === data.profile.id) {
        setUser({ ...currentUser, avatar_url: url });
      }

      setShowAvatarModal(false);
      showToast(url ? "Profile picture updated successfully!" : "Profile picture removed");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update avatar");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleAvatarSelect(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !data) return;
    setSavingProfile(true);
    try {
      await apiUpdateUserProfile(data.profile.id, {
        name: editForm.name,
        headline: editForm.headline,
        bio: editForm.bio,
        company: editForm.company,
        location: editForm.location,
        website: editForm.website,
        status_emoji: editForm.status_emoji,
        status_text: editForm.status_text,
      });

      setData((current) =>
        current
          ? {
              ...current,
              profile: {
                ...current.profile,
                name: editForm.name,
                headline: editForm.headline,
                bio: editForm.bio,
                company: editForm.company,
                location: editForm.location,
                website: editForm.website,
                status_emoji: editForm.status_emoji,
                status_text: editForm.status_text,
              },
            }
          : current
      );

      const currentUser = getUser();
      if (currentUser && currentUser.id === data.profile.id) {
        setUser({
          ...currentUser,
          name: editForm.name,
        });
      }

      setShowEditProfileModal(false);
      showToast("Profile details updated successfully!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update profile details");
    } finally {
      setSavingProfile(false);
    }
  };

  // 52-week contribution heatmap built from REAL API data (activityGraph = {"YYYY-MM-DD": count})
  const heatmapWeeks = useMemo(() => {
    const weeks: Array<Array<{ day: number; count: number; dateStr: string }>> = [];
    const realData: Record<string, number> = data?.activityGraph ?? {};
    const now = new Date();

    // Build from 51 weeks ago (oldest) up to current week (newest = index 51)
    for (let w = 51; w >= 0; w--) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const targetDate = new Date(now);
        // w=51 is oldest, d=0 is Sunday. Align so the last cell (w=0, d=6) is today.
        targetDate.setDate(targetDate.getDate() - (w * 7 + (6 - d)));
        // Format to YYYY-MM-DD for lookup
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
        const dd = String(targetDate.getDate()).padStart(2, "0");
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const dateStr = targetDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const count = realData[dateKey] ?? 0;
        days.push({ day: d, count, dateStr });
      }
      weeks.push(days);
    }
    return weeks;
  }, [data]);

  const totalAnnualContributions = useMemo(() => {
    if (!data?.activityGraph) return 0;
    return Object.values(data.activityGraph).reduce((acc, v) => acc + v, 0);
  }, [data]);

  const filteredWorkspaces = useMemo(() => {
    if (!data?.portfolio) return [];
    return data.portfolio.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
        project.description.toLowerCase().includes(workspaceSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || project.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [data, workspaceSearch, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
        <p className="text-white/40 text-sm font-light">Loading profile details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
          <h3 className="text-lg font-semibold text-red-200 mb-2">Failed to load profile</h3>
          <p className="text-sm text-red-300/80 mb-6">{error || "User profile could not be found."}</p>
          <Link
            href="/dashboard"
            className="inline-flex px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { profile, portfolio, followers, following, reputation, skills, isFollowing, isMutual } = data;

  return (
    <div className="min-h-screen text-white/90">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-medium shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {toastMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* GitHub 2-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ========================================================================= */}
          {/* LEFT SIDEBAR COLUMN: Identity, Avatar, Status, Bio, Meta, Badges, Skills  */}
          {/* ========================================================================= */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
            
            {/* Avatar & Hover Edit Trigger */}
            <div className="relative group mx-auto lg:mx-0 w-48 sm:w-60 lg:w-full max-w-[280px]">
              <div
                onClick={() => isOwner && setShowAvatarModal(true)}
                className={`aspect-square rounded-full border-2 border-white/10 bg-white/[0.03] overflow-hidden shadow-2xl relative ${
                  isOwner ? "cursor-pointer" : ""
                }`}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-white/[0.05] to-white/[0.12] text-4xl sm:text-5xl font-bold tracking-tight text-white/90">
                    {initials(profile.name)}
                  </div>
                )}

                {/* Edit Photo Overlay Button (if owner) */}
                {isOwner && (
                  <div
                    id="avatar-overlay-trigger"
                    className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-xs font-medium"
                    title="Change profile picture"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Change avatar</span>
                  </div>
                )}
              </div>

              {/* Status Emoji Bubble (bottom-right of avatar) */}
              <button
                type="button"
                id="status-emoji-trigger"
                onClick={() => isOwner && setShowEditProfileModal(true)}
                className={`absolute bottom-2 right-2 p-2 rounded-full border border-white/15 bg-[#0a0c10] shadow-xl text-sm ${
                  isOwner ? "cursor-pointer hover:scale-110 hover:border-white/40 transition-transform" : ""
                }`}
                title={profile.status_text || "Set custom status"}
              >
                <span>{profile.status_emoji || "🎯"}</span>
              </button>
            </div>

            {/* Names & Headline */}
            <div className="space-y-1 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                {profile.name}
              </h1>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-white/50 text-sm sm:text-base">
                <span>@{profile.username}</span>
                <span className="text-white/20">•</span>
                <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-mono bg-white/[0.06] text-white/70 border border-white/10">
                  {profile.role}
                </span>
              </div>

              {/* Status Message Text (if set) */}
              {profile.status_text && (
                <div className="pt-2 flex items-center justify-center lg:justify-start gap-2 text-xs text-white/80">
                  <span>{profile.status_emoji || "🎯"}</span>
                  <span className="italic truncate">{profile.status_text}</span>
                </div>
              )}
            </div>

            {/* Action Button: "Edit profile" for owner, "Follow" for others */}
            <div className="pt-1">
              {isOwner ? (
                <button
                  type="button"
                  id="edit-profile-button"
                  onClick={() => setShowEditProfileModal(true)}
                  className="w-full py-2 px-4 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/25 text-white text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Edit profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="follow-toggle-button"
                  onClick={handleFollowToggle}
                  disabled={followPending}
                  className={`w-full py-2 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isFollowing
                      ? "border border-white/20 bg-white/[0.06] hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 text-white"
                      : "bg-white text-black hover:bg-white/90 font-semibold shadow-lg shadow-white/10"
                  }`}
                >
                  {followPending ? (
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Following {isMutual ? "(Mutual)" : ""}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Bio Description */}
            {profile.bio && (
              <p className="text-sm text-white/80 leading-relaxed font-light break-words">
                {profile.bio}
              </p>
            )}

            {/* Followers & Following Metrics Bar */}
            <div className="flex items-center gap-4 text-xs sm:text-sm text-white/60 pt-1">
              <button
                type="button"
                id="view-followers-button"
                onClick={() => setActiveTab("followers")}
                className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <strong className="text-white font-medium">{followers}</strong> followers
              </button>
              <span className="text-white/20">•</span>
              <button
                type="button"
                id="view-following-button"
                onClick={() => setActiveTab("following")}
                className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <strong className="text-white font-medium">{following}</strong> following
              </button>
            </div>

            <hr className="border-white/[0.08]" />

            {/* Metadata Contact Details List (Company, Location, Link, Email, Joined) */}
            <div className="space-y-2.5 text-xs sm:text-sm text-white/70">
              {profile.company && (
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="truncate">{profile.company}</span>
                </div>
              )}

              {profile.location && (
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{profile.location}</span>
                </div>
              )}

              {profile.website && (
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline truncate"
                  >
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{profile.email}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatJoinDate(profile.created_at)}</span>
              </div>
            </div>

            <hr className="border-white/[0.08]" />

            {/* Highlights & Badges (GitHub Style) */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Achievements</h3>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white/90">
                  <span className="text-amber-400">⚡</span>
                  <span>PRO Member</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white/90">
                  <span className="text-cyan-400">🛡️</span>
                  <span>Verified Studio</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white/90">
                  <span className="text-emerald-400">🎯</span>
                  <span>{reputation}% Sync Accuracy</span>
                </div>
              </div>
            </div>

            {/* Creative Stack & Tools */}
            {skills && skills.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Creative Stack</h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/[0.04] text-white/75 border border-white/[0.08]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ========================================================================= */}
          {/* RIGHT MAIN CONTENT AREA: GitHub Tabs, Overview, Workspaces, Network       */}
          {/* ========================================================================= */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* GitHub Top Tab Bar */}
            <div className="border-b border-white/[0.08] pb-px overflow-x-auto scrollbar-none flex items-center justify-between gap-4">
              <nav className="flex space-x-1 sm:space-x-2">
                <button
                  type="button"
                  id="tab-overview"
                  onClick={() => setActiveTab("overview")}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "overview"
                      ? "border-white text-white font-semibold"
                      : "border-transparent text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Overview
                </button>

                <button
                  type="button"
                  id="tab-workspaces"
                  onClick={() => setActiveTab("workspaces")}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "workspaces"
                      ? "border-white text-white font-semibold"
                      : "border-transparent text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Workspaces
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/[0.08] text-white/70 font-mono">
                    {portfolio.length}
                  </span>
                </button>

                <button
                  type="button"
                  id="tab-pinned"
                  onClick={() => setActiveTab("pinned")}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "pinned"
                      ? "border-white text-white font-semibold"
                      : "border-transparent text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Stars
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/[0.08] text-white/70 font-mono">
                    {Math.min(portfolio.length, 6)}
                  </span>
                </button>

                <button
                  type="button"
                  id="tab-followers"
                  onClick={() => setActiveTab("followers")}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "followers"
                      ? "border-white text-white font-semibold"
                      : "border-transparent text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Followers
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/[0.08] text-white/70 font-mono">
                    {followers}
                  </span>
                </button>

                <button
                  type="button"
                  id="tab-following"
                  onClick={() => setActiveTab("following")}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "following"
                      ? "border-white text-white font-semibold"
                      : "border-transparent text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Following
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/[0.08] text-white/70 font-mono">
                    {following}
                  </span>
                </button>
              </nav>

              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  id="share-profile-button"
                  onClick={handleCopyProfile}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-white/70 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>Share Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* TAB 1: OVERVIEW (PINNED WORKSPACES & 52-WEEK HEATMAP)          */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "overview" && (
              <div className="space-y-8 pt-2">
                
                {/* Pinned Workspaces Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Pinned Workspaces
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("workspaces")}
                      className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      View all ({portfolio.length})
                    </button>
                  </div>

                  {portfolio.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] text-center space-y-3">
                      <p className="text-sm text-white/50">No workspaces published yet.</p>
                      {isOwner && (
                        <Link
                          href="/dashboard/projects"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all shadow-md"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create First Workspace
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {portfolio.slice(0, 6).map((project) => {
                        const statusConfig = STACK_COLORS[project.status] || STACK_COLORS.active;
                        return (
                          <div
                            key={project.id}
                            className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all flex flex-col justify-between group"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <Link
                                  href={`/dashboard/projects/${project.id}`}
                                  className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 hover:underline truncate group-hover:text-white transition-colors flex items-center gap-1.5"
                                >
                                  <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  </svg>
                                  <span className="truncate">{project.title}</span>
                                </Link>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-white/10 bg-white/[0.04] text-white/60">
                                  Public
                                </span>
                              </div>

                              <p className="text-xs text-white/60 line-clamp-2 font-light">
                                {project.description || "Collaborative timeline sequence and Premiere Pro synchronized workspace."}
                              </p>
                            </div>

                            <div className="pt-4 flex items-center justify-between text-xs text-white/50">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                                <span>{statusConfig.label}</span>
                              </div>
                              <span className="text-[11px]">Updated {formatDate(project.updated_at)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 52-Week Contribution Heatmap (Contribution Activity) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white tracking-tight">
                      {totalAnnualContributions} timeline contributions in {new Date().getFullYear()}
                    </h2>
                    <span className="text-xs text-white/40 font-mono">52-week activity</span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md overflow-hidden space-y-4">
                    {/* Heatmap Grid Container with Horizontal Scroll on small screens */}
                    <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                      <div className="min-w-[720px] flex gap-[3px]">
                        {heatmapWeeks.map((week, wIndex) => (
                          <div key={wIndex} className="flex flex-col gap-[3px]">
                            {week.map((day, dIndex) => {
                              let cellColor = "bg-white/[0.03] border-white/[0.04]";
                              if (day.count >= 1 && day.count <= 2) cellColor = "bg-emerald-700/50 border-emerald-700/60";
                              else if (day.count >= 3 && day.count <= 5) cellColor = "bg-emerald-500/70 border-emerald-500/80";
                              else if (day.count >= 6) cellColor = "bg-emerald-400 border-emerald-300";

                              const tooltip =
                                day.count === 0
                                  ? `No contributions on ${day.dateStr}`
                                  : `${day.count} contribution${day.count > 1 ? "s" : ""} on ${day.dateStr}`;

                              return (
                                <div
                                  key={dIndex}
                                  className={`w-[11px] h-[11px] rounded-xs border ${cellColor} transition-transform hover:scale-150 cursor-pointer`}
                                  title={tooltip}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Heatmap Legend */}
                    <div className="flex items-center justify-between text-[11px] text-white/40 pt-1 border-t border-white/[0.04]">
                      <span className="hover:text-white/60 cursor-pointer">Learn how we count timeline syncs</span>
                      <div className="flex items-center gap-1.5">
                        <span>Less</span>
                        <div className="w-2.5 h-2.5 rounded-xs bg-white/[0.03] border border-white/[0.04]" title="0 contributions" />
                        <div className="w-2.5 h-2.5 rounded-xs bg-emerald-700/50 border border-emerald-700/60" title="1–2 contributions" />
                        <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500/70 border border-emerald-500/80" title="3–5 contributions" />
                        <div className="w-2.5 h-2.5 rounded-xs bg-emerald-400 border border-emerald-300" title="6+ contributions" />
                        <span>More</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Feed Timeline Stream (GitHub Style) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                    Contribution Activity
                  </h3>
                  
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/[0.08]">
                    
                    {/* Activity Item 1 */}
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border border-white/20 bg-[#07080a] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-white/90">
                          Created <strong className="text-white font-medium">{portfolio.length} workspaces</strong> on Creaolink Cloud
                        </p>
                        <ul className="text-xs text-white/60 list-disc list-inside space-y-0.5">
                          {portfolio.slice(0, 3).map((p) => (
                            <li key={p.id}>
                              <Link href={`/dashboard/projects/${p.id}`} className="text-cyan-300 hover:underline">
                                {p.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <span className="text-[11px] text-white/40">September 2026</span>
                      </div>
                    </div>

                    {/* Activity Item 2 */}
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border border-white/20 bg-[#07080a] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs sm:text-sm text-white/90">
                          Joined Creaolink Studio Network & synchronized Premiere Pro plugin
                        </p>
                        <span className="text-[11px] text-white/40">{formatJoinDate(profile.created_at)}</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: WORKSPACES (GITHUB REPOSITORIES DIRECTORY)              */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "workspaces" && (
              <div className="space-y-6 pt-2">
                
                {/* Search & Filter Header */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div className="relative flex-1">
                    <svg className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Find a workspace..."
                      value={workspaceSearch}
                      onChange={(e) => setWorkspaceSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-white text-xs sm:text-sm placeholder:text-white/30 focus:outline-hidden focus:border-white/30"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-[#0d1017] text-white text-xs sm:text-sm focus:outline-hidden"
                    >
                      <option value="all">Type: All</option>
                      <option value="active">Active Review</option>
                      <option value="pending">In Revision</option>
                      <option value="approved">Approved Cut</option>
                    </select>

                    {isOwner && (
                      <Link
                        href="/dashboard/projects"
                        className="px-3.5 py-2 rounded-xl bg-white text-black text-xs sm:text-sm font-semibold hover:bg-white/90 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>New</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Workspaces List */}
                {filteredWorkspaces.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/[0.01]">
                    <p className="text-sm text-white/50">
                      {workspaceSearch ? "No workspaces match your search filter." : "No workspaces found."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {filteredWorkspaces.map((project) => {
                      const statusConfig = STACK_COLORS[project.status] || STACK_COLORS.active;
                      return (
                        <div key={project.id} className="py-5 space-y-3 group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/dashboard/projects/${project.id}`}
                                  className="text-base font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
                                >
                                  {project.title}
                                </Link>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-white/10 bg-white/[0.04] text-white/60">
                                  Public
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-white/60 font-light max-w-2xl">
                                {project.description || "Collaborative timeline sequence and Premiere Pro synchronized workspace."}
                              </p>
                            </div>

                            <Link
                              href={`/dashboard/projects/${project.id}`}
                              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/10 text-white text-xs font-medium transition-all shrink-0"
                            >
                              Open Studio
                            </Link>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-white/40">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                              <span>{statusConfig.label}</span>
                            </div>
                            <span>Updated {formatDate(project.updated_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: PINNED / STARS                                          */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "pinned" && (
              <div className="space-y-6 pt-2">
                <h2 className="text-base font-semibold text-white tracking-tight">Starred Workspaces</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolio.slice(0, 6).map((project) => (
                    <div
                      key={project.id}
                      className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="text-sm font-semibold text-cyan-300 hover:underline truncate flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <span>{project.title}</span>
                        </Link>
                        <p className="text-xs text-white/60 line-clamp-2">
                          {project.description || "Collaborative timeline sequence and Premiere Pro synchronized workspace."}
                        </p>
                      </div>
                      <div className="pt-3 text-[11px] text-white/40">
                        Updated {formatDate(project.updated_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: FOLLOWERS                                              */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "followers" && (
              <div className="space-y-4 pt-2">
                <h2 className="text-base font-semibold text-white tracking-tight">Followers ({followers})</h2>
                {data.followersList.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/[0.01]">
                    <p className="text-sm text-white/50">No followers yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {data.followersList.map((person) => (
                      <div key={person.id} className="py-4 flex items-center justify-between gap-4">
                        <Link
                          href={`/dashboard/profile/${person.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.05] overflow-hidden flex items-center justify-center font-bold text-xs">
                            {person.avatar_url ? (
                              <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
                            ) : (
                              initials(person.name)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                              {person.name}
                            </p>
                            <p className="text-xs text-white/50">@{person.username}</p>
                          </div>
                        </Link>

                        <Link
                          href={`/dashboard/profile/${person.id}`}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/10 text-white text-xs font-medium transition-all"
                        >
                          View Profile
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 5: FOLLOWING                                              */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "following" && (
              <div className="space-y-4 pt-2">
                <h2 className="text-base font-semibold text-white tracking-tight">Following ({following})</h2>
                {data.followingList.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/[0.01]">
                    <p className="text-sm text-white/50">Not following anyone yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {data.followingList.map((person) => (
                      <div key={person.id} className="py-4 flex items-center justify-between gap-4">
                        <Link
                          href={`/dashboard/profile/${person.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.05] overflow-hidden flex items-center justify-center font-bold text-xs">
                            {person.avatar_url ? (
                              <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
                            ) : (
                              initials(person.name)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                              {person.name}
                            </p>
                            <p className="text-xs text-white/50">@{person.username}</p>
                          </div>
                        </Link>

                        <Link
                          href={`/dashboard/profile/${person.id}`}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/10 text-white text-xs font-medium transition-all"
                        >
                          View Profile
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </main>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT PROFILE DETAILS MODAL (GITHUB STYLE)                        */}
      {/* ========================================================================= */}
      {showEditProfileModal && (
        <div id="edit-profile-modal-container" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0a0c10] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">Edit Profile Details</h3>
              <button
                type="button"
                id="close-edit-modal-btn"
                onClick={() => setShowEditProfileModal(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfileDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Display Name</label>
                <input
                  type="text"
                  id="edit-name-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm focus:outline-hidden focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Emoji</label>
                  <input
                    type="text"
                    id="edit-emoji-input"
                    value={editForm.status_emoji}
                    onChange={(e) => setEditForm({ ...editForm, status_emoji: e.target.value })}
                    placeholder="🎯"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm text-center focus:outline-hidden focus:border-white/30"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-white/70 mb-1">Status Message</label>
                  <input
                    type="text"
                    id="edit-status-input"
                    value={editForm.status_text}
                    onChange={(e) => setEditForm({ ...editForm, status_text: e.target.value })}
                    placeholder="What's happening? (e.g. Cutting teaser v2)"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm focus:outline-hidden focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Bio</label>
                <textarea
                  id="edit-bio-input"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  placeholder="Tell the Creaolink community a little about yourself..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm focus:outline-hidden focus:border-white/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Company / Studio</label>
                  <input
                    type="text"
                    id="edit-company-input"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    placeholder="e.g. Acme Studios"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm focus:outline-hidden focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Location</label>
                  <input
                    type="text"
                    id="edit-location-input"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm focus:outline-hidden focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Website / Portfolio URL</label>
                <input
                  type="text"
                  id="edit-website-input"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://creaolink.com/my-showreel"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm focus:outline-hidden focus:border-white/30"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  id="cancel-edit-btn"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-profile-btn"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  {savingProfile ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  ) : null}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AVATAR / PROFILE PICTURE PICKER MODAL                            */}
      {/* ========================================================================= */}
      {showAvatarModal && (
        <div id="avatar-modal-container" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0a0c10] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">Change Avatar</h3>
              <button
                type="button"
                id="close-avatar-modal-btn"
                onClick={() => setShowAvatarModal(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">Preset Avatars</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      id={`preset-avatar-${idx}`}
                      onClick={() => handleAvatarSelect(preset.url)}
                      disabled={updatingAvatar}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-cyan-400 focus:outline-hidden transition-all cursor-pointer"
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Custom Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="custom-avatar-url-input"
                    placeholder="https://example.com/avatar.jpg"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs placeholder:text-white/30 focus:outline-hidden focus:border-white/30"
                  />
                  <button
                    type="button"
                    id="apply-avatar-url-btn"
                    onClick={() => customAvatarUrl && handleAvatarSelect(customAvatarUrl)}
                    disabled={!customAvatarUrl || updatingAvatar}
                    className="px-3.5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Upload Local Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  id="upload-local-avatar-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updatingAvatar}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-medium text-white/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Select Image from Computer</span>
                </button>
              </div>

              {profile.avatar_url && (
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    id="remove-avatar-btn"
                    onClick={() => handleAvatarSelect(null)}
                    disabled={updatingAvatar}
                    className="w-full py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                  >
                    Remove Current Avatar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
