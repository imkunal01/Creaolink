"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      setLoading(false);
    }
    loadUser();
  }, [router]);

  if (loading) {
    return (
      <main className="container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user.display_name || "User"}!</h1>
          <p className="muted">
            {user.role === "CLIENT"
              ? "Manage your projects and find editors."
              : "Manage your profile and view project requests."}
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <span className="stat-icon">📧</span>
          <div className="stat-content">
            <span className="stat-value" style={{ fontSize: "0.9rem" }}>{user.email}</span>
            <span className="stat-label">Email</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">{user.role === "CLIENT" ? "🎬" : "✂️"}</span>
          <div className="stat-content">
            <span className="stat-value">{user.role}</span>
            <span className="stat-label">Role</span>
          </div>
        </div>
      </div>

      {user.role === "CLIENT" ? (
        <section className="section">
          <h2>Quick Actions</h2>
          <div className="grid">
            <Link href="/editors" className="card link-card">
              <h3>🔍 Find Editors</h3>
              <p className="muted">Browse and filter editors by skill, rating, and availability.</p>
            </Link>
            <Link href="/bookmarks" className="card link-card">
              <h3>💾 Saved Editors</h3>
              <p className="muted">View your bookmarked editors for quick access.</p>
            </Link>
            <div className="card">
              <h3>📁 My Projects</h3>
              <p className="muted">Coming in Phase 3 — Create projects and assign editors.</p>
            </div>
            <div className="card">
              <h3>💬 Messages</h3>
              <p className="muted">Coming soon — Direct messaging with your editors.</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="section">
          <h2>Quick Actions</h2>
          <div className="grid">
            <Link href="/editor/dashboard" className="card link-card">
              <h3>✏️ Edit Profile</h3>
              <p className="muted">Update your headline, skills, and portfolio.</p>
            </Link>
            <Link href="/editors" className="card link-card">
              <h3>👀 View Marketplace</h3>
              <p className="muted">See how your profile appears to clients.</p>
            </Link>
            <div className="card">
              <h3>📋 Project Requests</h3>
              <p className="muted">Coming in Phase 3 — View and accept project invites.</p>
            </div>
            <div className="card">
              <h3>📊 Analytics</h3>
              <p className="muted">Coming soon — Track profile views and engagement.</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
