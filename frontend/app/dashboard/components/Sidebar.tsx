"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    if (status === "active") return "#38bdf8";
    if (status === "pending") return "#fbbf24";
    if (status === "approved" || status === "completed") return "#34d399";
    return "#71717a";
  };

  return (
    <aside className={`app-sidebar${open ? " open" : ""}`}>
      {/* WORKSPACE section */}
      <div className="sb-section-label">Workspace</div>

      <Link
        href="/dashboard"
        className={`sb-item${isDash ? " active" : ""}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </svg>
        Overview
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

      <Link
        href="/dashboard/profile"
        className={`sb-item${isProfile ? " active" : ""}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Profile & Portfolio
      </Link>

      <Link
        href="/premiere-setup"
        className="sb-item"
        style={{ color: "#a1a1aa" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Premiere Plugin
        <span className="sb-badge" style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399", borderColor: "rgba(52, 211, 153, 0.3)" }}>UXP</span>
      </Link>

      <Link
        href="/admin"
        className="sb-item"
        style={{
          background: "rgba(255, 42, 61, 0.08)",
          color: "#ff4b5c",
          border: "1px solid rgba(255, 42, 61, 0.25)",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        Admin Console
        <span className="sb-badge" style={{ background: "rgba(255, 42, 61, 0.2)", color: "#ff4b5c", borderColor: "rgba(255, 42, 61, 0.4)" }}>
          ADMIN
        </span>
      </Link>

      {/* PROJECTS section */}
      {projects.length > 0 && (
        <>
          <div className="sb-divider" />
          <div className="sb-section-label">Active Rooms</div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
            {projects.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className="sb-proj-item"
                style={{
                  color: pathname === `/dashboard/projects/${p.id}` ? "#ffffff" : undefined,
                  fontWeight: pathname === `/dashboard/projects/${p.id}` ? 600 : 400,
                }}
              >
                <span
                  className="sb-proj-dot"
                  style={{ background: statusColor(p.status) }}
                />
                <span className="truncate">{p.title}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Bottom user card */}
      <div className="sb-bottom">
        <div className="sb-divider" />
        <button
          onClick={handleLogout}
          className="sb-user-card"
          style={{ width: "100%", cursor: "pointer" }}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sb-user-name">Sign out</div>
            <div className="sb-user-role font-mono text-[10px]">End session</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-500">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
