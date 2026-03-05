"use client";

import { useEffect, useState } from "react";
import { getUser, type User } from "@/lib/auth";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div className="min-h-dvh bg-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main column — push right on lg+ */}
      <div className="lg:ml-[220px] flex flex-col min-h-dvh">
        <Topbar user={user} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1100px] w-full">
          {typeof children === "object" && children !== null
            ? children
            : null}
        </main>
      </div>
    </div>
  );
}
