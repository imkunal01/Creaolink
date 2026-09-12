"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

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
    const currentUser = getUser();
    setUser(currentUser);
    setReady(true);
    if (!currentUser) {
      router.replace("/auth/login");
    }
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
    return (
      <div className="h-[100dvh] bg-[#08090a] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#00e5ff] animate-spin" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Topbar user={user} onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <div className="app-body">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Mobile backdrop overlay */}
        <div
          className={`sidebar-overlay${sidebarOpen ? " visible" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <main className="app-main">
          {typeof children === "object" && children !== null ? children : null}
        </main>
      </div>
    </div>
  );
}
