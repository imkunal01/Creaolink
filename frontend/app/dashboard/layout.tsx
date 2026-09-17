"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, setUser as saveUser, type User } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { DashboardShellSkeleton } from "./components/DashboardSkeletons";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const syncUser = async () => {
      const currentUser = getUser();
      setUser(currentUser);
      setReady(true);
      if (!currentUser) {
        router.replace("/auth/login");
        return;
      }

      try {
        const res = await apiFetch("/api/auth/me");
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.user && (data.user.role !== currentUser.role || data.user.status !== currentUser.status || data.user.name !== currentUser.name)) {
            setUser(data.user);
            saveUser(data.user);
          }
        }
      } catch {
        // ignore background fetch error
      }
    };
    syncUser();
    window.addEventListener("cl_user_update", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      cancelled = true;
      window.removeEventListener("cl_user_update", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  if (!ready || !user) {
    return <DashboardShellSkeleton />;
  }

  return (
    <div className="app-shell relative overflow-hidden bg-[#07080a]">
      {/* ─────────────────────────────────────────────────────────────
          Top-Left Atmospheric Sun Flare & Volumetric Light Beam
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute -top-40 -left-40 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,248,225,0.22)_0%,_rgba(255,210,120,0.08)_25%,_rgba(255,160,60,0.02)_50%,_transparent_75%)] blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,_rgba(0,229,255,0.06)_0%,_transparent_70%)] blur-[90px] pointer-events-none z-0" />

      <Topbar user={user} onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <div className="app-body relative z-10 bg-transparent">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

        {/* Mobile backdrop overlay */}
        <div
          className={`sidebar-overlay${sidebarOpen ? " visible" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <main className="app-main bg-transparent">
          {typeof children === "object" && children !== null ? children : null}
        </main>
      </div>
    </div>
  );
}
