"use client";

import { useEffect, useState } from "react";
import { getUser, type User } from "@/lib/auth";
import ClientDashboard from "./components/ClientDashboard";
import FreelancerDashboard from "./components/FreelancerDashboard";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  // Redirect to login if not authenticated
  if (!user) {
    window.location.href = "/auth/login";
    return null;
  }

  // Role-based UI branching
  if (user.role === "freelancer") {
    return <FreelancerDashboard user={user} />;
  }

  return <ClientDashboard user={user} />;
}
