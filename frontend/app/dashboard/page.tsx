"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    return <span className="tag tag-a">● Active</span>;
  if (status === "pending")
    return <span className="tag tag-r">⏳ Review</span>;
  return <span className="tag tag-d">✓ Done</span>;
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
  const styles: Record<string, { bg: string; color: string; letter: string }> = {
    version: { bg: "var(--rs)", color: "var(--red)", letter: "v" },
    join: { bg: "rgba(74,222,128,.1)", color: "#4ade80", letter: "✓" },
    feedback: { bg: "rgba(251,191,36,.1)", color: "#fbbf24", letter: "!" },
    create: { bg: "var(--s3)", color: "var(--m2)", letter: "+" },
  };
  const key = item.status?.toLowerCase() || "create";
  const s = styles[key] || styles.create;
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.66rem", fontWeight: 700, border: "1px solid var(--b2)",
      background: s.bg, color: s.color,
    }}>
      {s.letter}
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

  const openFeedback = 0; // placeholder — would come from API
  const currentVersion = projects[0] ? "v1" : "—";

  return (
    <div className="mc">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", gap: "1rem" }}>
        <div>
          <div style={{ fontFamily: "var(--fd)", fontSize: "1.55rem", color: "var(--white)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Good morning, {user.name?.split(" ")[0] || "there"}.
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--m2)", marginTop: "0.2rem" }}>
            Here&apos;s what&apos;s happening across your projects today.
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <button className="btn btn-g btn-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="9" y2="18" />
            </svg>
            Activity log
          </button>
          <button className="btn btn-p btn-sm" onClick={() => router.push("/dashboard/projects")}>
            + New project
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-num accent">{projects.length}</div>
          <div className="kpi-label">Active projects</div>
          <div className="kpi-trend up">↑ {projects.length} total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-num">{openFeedback}</div>
          <div className="kpi-label">Open feedback</div>
          <div className="kpi-trend dn">↑ {openFeedback} unresolved</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-num">{currentVersion}</div>
          <div className="kpi-label">Latest version</div>
          <div className="kpi-trend up">↑ {projects[0]?.title || "—"}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-num">11</div>
          <div className="kpi-label">Reputation score</div>
          <div className="kpi-trend up">↑ All time</div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 290px", gap: "1.1rem" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Projects table */}
          <div className="cl-card">
            <div className="cl-card-head">
              <span className="cl-card-title">Recent Projects</span>
              <a href="/dashboard/projects" style={{ fontSize: "0.72rem", color: "var(--m1)" }}>
                All projects →
              </a>
            </div>
            {/* Table head */}
            <div style={{
              display: "grid", gridTemplateColumns: "minmax(0,1fr) 100px 95px 90px",
              gap: "0.6rem", padding: "0.55rem 1.1rem", borderBottom: "1px solid var(--b2)",
              fontSize: "0.63rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--m1)",
            }}>
              <span>Project</span><span>Owner</span><span>Status</span><span>Updated</span>
            </div>
            {loadingProjects ? (
              <div style={{ padding: "1.5rem 1.1rem", fontSize: "0.8rem", color: "var(--m1)" }}>Loading…</div>
            ) : projects.length === 0 ? (
              <div style={{ padding: "2rem 1.1rem", textAlign: "center", fontSize: "0.8rem", color: "var(--m1)" }}>
                No projects yet.{" "}
                <button
                  onClick={() => router.push("/dashboard/projects")}
                  style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  Create one →
                </button>
              </div>
            ) : (
              projects.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                  style={{
                    display: "grid", gridTemplateColumns: "minmax(0,1fr) 100px 95px 90px",
                    gap: "0.6rem", padding: "0.7rem 1.1rem", borderBottom: "1px solid var(--b1)",
                    fontSize: "0.78rem", alignItems: "center", cursor: "pointer",
                    background: "none", border: "none", width: "100%", textAlign: "left",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--m1)", marginTop: 1 }}>Project</div>
                  </div>
                  <div style={{ color: "var(--m2)" }}>{user.name?.split(" ")[0] || "You"}</div>
                  <div>{statusTag(p.status)}</div>
                  <div style={{ color: "var(--m1)" }}>{formatDate(p.created_at)}</div>
                </button>
              ))
            )}
          </div>

          {/* Activity feed */}
          <div className="cl-card">
            <div className="cl-card-head">
              <span className="cl-card-title">Activity feed</span>
              <span style={{ fontSize: "0.72rem", color: "var(--m1)" }}>See all →</span>
            </div>
            <div style={{ padding: "0.2rem 0" }}>
              {activity.length === 0 ? (
                <div style={{ padding: "1.25rem 1.1rem", fontSize: "0.8rem", color: "var(--m1)" }}>
                  No recent activity yet.
                </div>
              ) : (
                activity.slice(0, 5).map((item) => (
                  <div key={item.id} style={{
                    display: "flex", gap: "0.75rem", padding: "0.75rem 1.1rem",
                    borderBottom: "1px solid var(--b1)", alignItems: "flex-start",
                  }}>
                    {activityIcon(item)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--m2)", lineHeight: 1.45 }}>
                        <strong style={{ color: "var(--white)", fontWeight: 500 }}>{item.owner_name}</strong>{" "}
                        {item.title}
                      </div>
                      <div style={{ fontSize: "0.66rem", color: "var(--m1)", marginTop: "0.18rem" }}>
                        {formatDate(item.created_at || new Date().toISOString())}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Open feedback */}
          <div className="cl-card">
            <div className="cl-card-head">
              <span className="cl-card-title">Open feedback</span>
              <span className="tag tag-a" style={{ fontSize: "0.6rem" }}>{openFeedback} open</span>
            </div>
            <div style={{ padding: "0.65rem 1.1rem" }}>
              {openFeedback === 0 ? (
                <div style={{ fontSize: "0.76rem", color: "var(--m1)", textAlign: "center", padding: "0.5rem 0" }}>
                  No open feedback. All clear!
                </div>
              ) : null}
            </div>
          </div>

          {/* Quick actions */}
          <div className="cl-card">
            <div className="cl-card-head">
              <span className="cl-card-title">Quick actions</span>
            </div>
            {[
              {
                label: "Create new project",
                icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
                onClick: () => router.push("/dashboard/projects"),
              },
              {
                label: "View all projects",
                icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
                onClick: () => router.push("/dashboard/projects"),
              },
              {
                label: "Edit profile",
                icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
                onClick: () => router.push("/dashboard/profile"),
              },
            ].map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                style={{
                  display: "flex", alignItems: "center", gap: "0.65rem",
                  padding: "0.6rem 1.1rem", borderBottom: "1px solid var(--b1)",
                  fontSize: "0.78rem", color: "var(--m2)", cursor: "pointer",
                  transition: "all 0.12s", background: "none", border: "none", width: "100%",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--white)";
                  e.currentTarget.style.background = "var(--s2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--m2)";
                  e.currentTarget.style.background = "none";
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }}>
                  {action.icon}
                </svg>
                {action.label}
              </button>
            ))}
          </div>

          {/* Network */}
          <div className="cl-card">
            <div className="cl-card-head">
              <span className="cl-card-title">Network</span>
            </div>
            <div style={{ padding: "0.65rem 1.1rem" }}>
              {network.length === 0 ? (
                <div style={{ fontSize: "0.75rem", color: "var(--m1)", padding: "0.35rem 0" }}>
                  No connections yet. Follow users to build your network.
                </div>
              ) : (
                network.slice(0, 3).map((person) => (
                  <div key={person.following_id} style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.45rem 0", borderBottom: "1px solid var(--b1)",
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: "#7dd3fc", color: "#0d0f0e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.56rem", fontWeight: 700, flexShrink: 0,
                    }}>
                      {person.name?.slice(0, 2).toUpperCase() || "??"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--white)" }}>{person.name}</div>
                      <div style={{ fontSize: "0.67rem", color: "var(--m1)" }}>{person.project_count} projects</div>
                    </div>
                    <button className="btn btn-g btn-sm">Open</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
