"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import ClientDashboard from "./components/ClientDashboard";
import FreelancerDashboard from "./components/FreelancerDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [user] = useState<User | null>(() => getUser());

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
    }
  }, [router, user]);

  if (!user) return null;

  // Role-based UI branching
  if (user?.role === "freelancer") {
    return <FreelancerDashboard user={user} />;
  }

  return <ClientDashboard user={user} />;
}
