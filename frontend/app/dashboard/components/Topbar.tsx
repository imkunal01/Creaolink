"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { apiSearchUsers, type SearchUserItem } from "@/lib/api";
import {
  getUnreadCount,
  markAllRead,
  startNotificationPolling,
} from "@/lib/notifications";
import NotificationPanel from "./NotificationPanel";

interface TopbarProps {
  user: User | null;
  onMenuToggle: () => void;
}

export default function Topbar({ user, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Notifications
  const [unread, setUnread] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Start polling once we have a user
  useEffect(() => {
    if (!user?.id) return;
    startNotificationPolling(user.id);

    const syncUnread = () => setUnread(getUnreadCount());
    syncUnread();

    window.addEventListener("cl_notif_update", syncUnread);
    window.addEventListener("storage", syncUnread);
    const tick = setInterval(syncUnread, 5000);
    return () => {
      window.removeEventListener("cl_notif_update", syncUnread);
      window.removeEventListener("storage", syncUnread);
      clearInterval(tick);
    };
  }, [user?.id]);

  // Search debounce
  useEffect(() => {
    let cancelled = false;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await apiSearchUsers(query.trim());
        if (!cancelled) setResults(data.users || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleBellClick = () => {
    if (!panelOpen && unread > 0) {
      // Don't mark read yet — user needs to see them
    }
    setPanelOpen((v) => !v);
  };

  return (
    <header className="app-topbar">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden"
        style={{
          background: "var(--s3)",
          border: "1px solid var(--b2)",
          borderRadius: "var(--r)",
          cursor: "pointer",
          color: "var(--m2)",
          padding: 0,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          touchAction: "manipulation",
          transition: "background 0.12s, color 0.12s",
        }}
        aria-label="Toggle menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>


      {/* Logo */}
      <Link href="/" className="tb-logo">
        <b>Creao</b>Link
      </Link>

      {/* Search */}
      <div className="tb-search" style={{ position: "relative" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--m1)", flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, projects…"
        />
        {(loading || results.length > 0) && (
          <div style={{
            position: "absolute", left: 0, right: 0, top: "calc(100% + 8px)",
            background: "var(--s1)", border: "1px solid var(--b2)",
            borderRadius: "var(--r)", boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
            zIndex: 100, overflow: "hidden",
          }}>
            {loading ? (
              <div style={{ padding: "10px 12px", fontSize: "0.76rem", color: "var(--m1)" }}>Searching…</div>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setQuery(""); setResults([]); router.push(`/dashboard/profile/${item.id}`); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "8px 12px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--m2)", fontSize: "0.8rem", transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <div style={{ color: "var(--white)", fontWeight: 500, fontSize: "0.8rem" }}>{item.name}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--m1)" }}>@{item.username}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="tb-right">
        {/* Notification bell */}
        <div ref={bellRef} style={{ position: "relative" }}>
          <button
            onClick={handleBellClick}
            className="tb-notif"
            title="Notifications"
            style={{ position: "relative", cursor: "pointer" }}
            aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unread > 0 && (
              <div className="dot" style={{ position: "absolute", top: -1, right: -1 }}>
                {unread <= 9 ? (
                  <span style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.42rem", fontWeight: 800, color: "#fff",
                    lineHeight: 1,
                  }}>
                    {unread}
                  </span>
                ) : null}
              </div>
            )}
          </button>

          {/* Notification panel dropdown */}
          <NotificationPanel
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
          />
        </div>

        {/* User chip */}
        <Link href="/dashboard/profile" className="tb-user">
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "var(--red)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.56rem", fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "0.77rem", fontWeight: 500, color: "var(--white)", lineHeight: 1.2 }}>
              {user?.name ?? "User"}
            </div>
            <div style={{ fontSize: "0.64rem", color: "var(--m1)", lineHeight: 1.2, textTransform: "capitalize" }}>
              {user?.role ?? "—"}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
