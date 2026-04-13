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

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-[#0d1117]" />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <Topbar user={user} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {typeof children === "object" && children !== null
            ? children
            : null}
        </main>
      </div>
    </div>
  );
}
