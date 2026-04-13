"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import ClientDashboard from "./components/ClientDashboard";
import FreelancerDashboard from "./components/FreelancerDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    setReady(true);

    if (!currentUser) {
      router.replace("/auth/login");
    }
  }, [router]);

  if (!ready || !user) return null;

  // Role-based UI branching
  if (user?.role === "freelancer") {
    return <FreelancerDashboard user={user} />;
  }

  return <ClientDashboard user={user} />;
}
