"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user] = useState<User | null>(() => getUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
    }
  }, [router, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-bg" />
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="ml-[220px]">
        <Topbar user={user} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="px-6 lg:px-8 py-6 max-w-[1100px]">
          {typeof children === "object" && children !== null
            ? children
            : null}
        </main>
      </div>
    </div>
  );
}
