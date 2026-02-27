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

  useEffect(() => {
    // Load user if logged in — dashboard is accessible without auth
    setUser(getUser());
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div className="ml-[220px]">
        <Topbar user={user} />
        <main className="px-6 lg:px-8 py-6 max-w-[1100px]">
          {typeof children === "object" && children !== null
            ? children
            : null}
        </main>
      </div>
    </div>
  );
}
