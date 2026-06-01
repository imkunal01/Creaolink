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
  if (status === "active") return <span className="tag tag-a">● Active</span>;
  if (status === "pending") return <span className="tag tag-r">⏳ Review</span>;
  return <span className="tag tag-d">✓ Done</span>;
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
      <div className="mc" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--b2)", borderTopColor: "var(--red)", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mc">
        <div style={{ background: "var(--rs)", border: "1px solid var(--rg)", borderRadius: "var(--r)", padding: "0.75rem 1rem", fontSize: "0.82rem", color: "var(--red)" }}>
          {error || "Profile not found"}
        </div>
      </div>
    );
  }

  const maxContrib = Math.max(...data.activityGraph.map((i) => i.contributions), 1);
  const avatarColors = ["var(--red)", "#7dd3fc", "#f9a8d4", "#86efac", "#fbbf24"];
  const avatarColor = avatarColors[data.profile.name.charCodeAt(0) % avatarColors.length];

  return (
    <div className="mc" style={{ paddingBottom: "2.5rem" }}>
      {error && (
        <div style={{ background: "var(--rs)", border: "1px solid var(--rg)", borderRadius: "var(--r)", padding: "0.6rem 1rem", fontSize: "0.8rem", color: "var(--red)", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Profile header card */}
      <div className="cl-card" style={{ marginBottom: "1.25rem", overflow: "hidden" }}>
        {/* Cover */}
        <div className="prof-cover">
          <div className="prof-av-wrap">
            <div className="prof-av" style={{ background: avatarColor, color: avatarColor === "var(--red)" ? "#fff" : "#0d0f0e" }}>
              {initials(data.profile.name)}
            </div>
          </div>
        </div>

        {/* Info below cover */}
        <div style={{ paddingTop: "3.5rem", padding: "3.5rem 1.75rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: "1.55rem", color: "var(--white)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  {data.profile.name}
                </div>
                <span style={{ fontSize: "0.73rem", color: "var(--m1)", padding: "2px 9px", borderRadius: 999, background: "var(--s3)", border: "1px solid var(--b2)" }}>
                  @{data.profile.username}
                </span>
                <span className="tag tag-n" style={{ fontSize: "0.67rem", textTransform: "capitalize" }}>
                  {data.profile.role}
                </span>
                {data.isMutual && !isCurrentUser && (
                  <span style={{ fontSize: "0.67rem", color: "#4ade80", background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.22)", padding: "2px 8px", borderRadius: 5 }}>
                    Mutual
                  </span>
                )}
              </div>
              {data.profile.headline && (
                <div style={{ fontSize: "0.8rem", color: "var(--m1)", marginTop: "0.25rem", fontStyle: "italic" }}>
                  {isCurrentUser ? "Your public profile" : data.profile.headline}
                </div>
              )}
              {data.profile.bio && (
                <div style={{ fontSize: "0.82rem", color: "var(--m2)", lineHeight: 1.65, marginTop: "0.6rem", maxWidth: 480 }}>
                  {data.profile.bio}
                </div>
              )}

              {/* Skills */}
              {data.skills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.75rem" }}>
                  {data.skills.map((skill) => (
                    <span key={skill} className="tag tag-n" style={{ fontSize: "0.67rem" }}>{skill}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions + stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: 160 }}>
              {!isCurrentUser && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followPending}
                  className={`btn btn-lg ${data.isFollowing ? "btn-g" : "btn-p"}`}
                  style={{ width: "100%" }}
                >
                  {followPending ? "Updating…" : data.isFollowing ? "Following" : "Follow"}
                </button>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {[
                  { label: "Followers", value: data.followers },
                  { label: "Following", value: data.following },
                  { label: "Projects", value: data.portfolio.length },
                  { label: "Reputation", value: data.reputation },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: "var(--s3)", border: "1px solid var(--b1)",
                    borderRadius: "var(--r)", padding: "0.6rem 0.75rem", textAlign: "center",
                  }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: "1.3rem", color: "var(--white)", lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: "0.64rem", color: "var(--m1)", marginTop: "0.15rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 290px", gap: "1.1rem", alignItems: "start" }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Activity graph */}
          <div className="cl-card">
            <div className="cl-card-head">
              <span className="cl-card-title">Activity graph</span>
              <span style={{ fontSize: "0.72rem", color: "var(--m1)" }}>12-week view</span>
            </div>
            <div style={{ padding: "1.1rem 1.1rem 0.75rem" }}>
              <div className="contrib-graph">
                {data.activityGraph.map((item) => (
                  <div key={item.week} className="cg-col">
                    <div className="cg-bar-wrap">
                      <div
                        className="cg-bar"
                        style={{
                          height: `${Math.max(8, (item.contributions / maxContrib) * 80)}%`,
                          background: item.contributions > 0
                            ? `linear-gradient(to top, var(--red), rgba(232,57,46,0.4))`
                            : "transparent",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.54rem", color: "var(--m1)", marginTop: "0.2rem" }}>W{item.week}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio */}
          <div className="cl-card">
            <div className="cl-card-head">
              <span className="cl-card-title">Public portfolio</span>
              <span style={{ fontSize: "0.72rem", color: "var(--m1)" }}>{data.portfolio.length} project{data.portfolio.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ padding: "0.85rem 1.1rem" }}>
              {data.portfolio.length === 0 ? (
                <div style={{ border: "1px dashed var(--b2)", borderRadius: "var(--r)", padding: "1.5rem", textAlign: "center", fontSize: "0.8rem", color: "var(--m1)" }}>
                  No public projects yet.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {data.portfolio.map((project) => (
                    <div key={project.id} style={{
                      background: "var(--s3)", border: "1px solid var(--b1)",
                      borderRadius: "var(--r)", padding: "0.85rem",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--white)", lineHeight: 1.3 }}>{project.title}</div>
                        {statusTag(project.status)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--m1)", lineHeight: 1.55, marginBottom: "0.5rem" }}>
                        {project.description || "A public case study from this creator's portfolio."}
                      </div>
                      <div style={{ fontSize: "0.66rem", color: "var(--m1)" }}>
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Followers */}
          <div className="cl-card">
            <div className="cl-card-head">
              <span className="cl-card-title">Followers</span>
              <span style={{ fontSize: "0.72rem", color: "var(--m1)" }}>{data.followers} total</span>
            </div>
            <div style={{ padding: "0.25rem 0" }}>
              {data.followersList.length === 0 ? (
                <div style={{ padding: "0.85rem 1.1rem", fontSize: "0.79rem", color: "var(--m1)" }}>No followers yet.</div>
              ) : (
                data.followersList.map((person) => (
                  <Link key={person.id} href={`/dashboard/profile/${person.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "0.55rem",
                      padding: "0.55rem 1.1rem", borderBottom: "1px solid var(--b1)",
                      transition: "background 0.1s", cursor: "pointer",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: "var(--s4)", border: "1px solid var(--b2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.54rem", fontWeight: 700, color: "var(--m2)", flexShrink: 0,
                      }}>
                        {person.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--white)" }}>{person.name}</div>
                        <div style={{ fontSize: "0.67rem", color: "var(--m1)", textTransform: "capitalize" }}>{person.role}</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Following */}
          <div className="cl-card">
            <div className="cl-card-head">
              <span className="cl-card-title">Following</span>
              <span style={{ fontSize: "0.72rem", color: "var(--m1)" }}>{data.following} total</span>
            </div>
            <div style={{ padding: "0.25rem 0" }}>
              {data.followingList.length === 0 ? (
                <div style={{ padding: "0.85rem 1.1rem", fontSize: "0.79rem", color: "var(--m1)" }}>
                  {isCurrentUser ? "You're not following anyone yet." : "Not following anyone yet."}
                </div>
              ) : (
                data.followingList.map((person) => (
                  <Link key={person.id} href={`/dashboard/profile/${person.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "0.55rem",
                      padding: "0.55rem 1.1rem", borderBottom: "1px solid var(--b1)",
                      transition: "background 0.1s", cursor: "pointer",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: "var(--s4)", border: "1px solid var(--b2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.54rem", fontWeight: 700, color: "var(--m2)", flexShrink: 0,
                      }}>
                        {person.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--white)" }}>{person.name}</div>
                        <div style={{ fontSize: "0.67rem", color: "var(--m1)", textTransform: "capitalize" }}>{person.role}</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Visibility */}
          <div className="cl-card">
            <div className="cl-card-head">
              <span className="cl-card-title">Profile visibility</span>
            </div>
            <div style={{ padding: "0.75rem 1.1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", animation: "pulse-dot 2s ease-in-out infinite" }} />
                <span style={{ fontSize: "0.78rem", color: "var(--white)", fontWeight: 500 }}>Public</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--m1)", lineHeight: 1.6 }}>
                This profile is visible to the community. Followers can discover portfolio items, reputation, and activity trends.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
