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

  // Role-based UI branching
  if (user?.role === "freelancer") {
    return <FreelancerDashboard user={user} />;
  }

  // Logged-in client / admin, or guest (unauthenticated) — show client dashboard
  const guestUser: User = { id: "guest", name: "Guest", email: "", role: "client" };
  return <ClientDashboard user={user ?? guestUser} />;
}
