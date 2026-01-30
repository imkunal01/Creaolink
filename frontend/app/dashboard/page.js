"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
      setLoading(false);
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <main className="container">
      <h1>Dashboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <div className="card">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Display name:</strong> {user.display_name || "—"}</p>
        </div>
      ) : (
        <p>Not signed in.</p>
      )}
      <button className="button" onClick={handleLogout}>Log out</button>
    </main>
  );
}
