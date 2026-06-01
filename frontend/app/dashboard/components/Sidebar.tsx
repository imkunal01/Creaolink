"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { logout } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<
    Array<{ id: string; title: string; status: string; created_at: string }>
  >([]);

  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    async function fetchProjects() {
      try {
        const res = await apiFetch("/api/projects");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setProjects(data.projects || []);
      } catch {
        // ignore
      }
    }
    fetchProjects();
    return () => { cancelled = true; };
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const isDash = pathname === "/dashboard";
  const isProjects = pathname.startsWith("/dashboard/projects");
  const isProfile = pathname.startsWith("/dashboard/profile");

  const statusColor = (status: string) => {
    if (status === "active") return "var(--red)";
    if (status === "pending") return "#fbbf24";
    return "var(--m1)";
  };

  return (
    <aside
      className={`app-sidebar${open ? " open" : ""}`}
      style={{ paddingTop: "0.75rem" }}
    >
      {/* WORKSPACE section */}
      <div className="sb-section-label">Workspace</div>

      <Link
        href="/dashboard"
        className={`sb-item${isDash ? " active" : ""}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        Dashboard
      </Link>

      <Link
        href="/dashboard/projects"
        className={`sb-item${isProjects ? " active" : ""}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        Projects
        {projects.length > 0 && (
          <span className="sb-badge">{projects.length}</span>
        )}
      </Link>

      <Link href="/dashboard" className="sb-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </Link>

      <Link href="/dashboard" className="sb-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Timeline
      </Link>

      {/* PROJECTS section */}
      {projects.length > 0 && (
        <>
          <div className="sb-divider" />
          <div className="sb-section-label">Projects</div>
          {projects.slice(0, 6).map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}`}
              className="sb-proj-item"
              style={{
                color: pathname === `/dashboard/projects/${p.id}` ? "var(--white)" : undefined,
              }}
            >
              <span
                className="sb-proj-dot"
                style={{ background: statusColor(p.status) }}
              />
              {p.title}
            </Link>
          ))}
        </>
      )}

      {/* ACCOUNT section */}
      <div className="sb-divider" />
      <div className="sb-section-label">Account</div>

      <Link
        href="/dashboard/profile"
        className={`sb-item${isProfile ? " active" : ""}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Profile
      </Link>

      {/* Bottom user card */}
      <div className="sb-bottom">
        <button
          onClick={handleLogout}
          className="sb-user-card"
          style={{ width: "100%", cursor: "pointer" }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.58rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            KK
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sb-user-name">My Workspace</div>
            <div className="sb-user-role">Log out</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--m1)", flexShrink: 0 }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
