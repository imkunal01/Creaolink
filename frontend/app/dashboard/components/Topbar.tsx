"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { apiSearchUsers, type SearchUserItem } from "@/lib/api";
import {
  getUnreadCount,
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

  return (
    <header className="app-topbar">
      {/* Left: Mobile hamburger + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md bg-[#141618] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Link href="/" className="tb-logo">
          <b>Creao</b><span>Link</span>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="relative flex-1 max-w-sm hidden sm:block">
        <div className="tb-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, editors, clients..."
          />
        </div>

        {(loading || results.length > 0) && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-md border border-white/[0.08] bg-[#141618] shadow-2xl">
            {loading ? (
              <div className="px-3 py-2 text-xs font-mono text-zinc-500">Searching workspace...</div>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setQuery(""); setResults([]); router.push(`/dashboard/profile/${item.id}`); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#1c1e22] transition-colors flex items-center justify-between cursor-pointer border-b border-white/[0.04] last:border-b-0"
                >
                  <div>
                    <div className="text-xs font-medium text-white">{item.name}</div>
                    <div className="text-[10px] font-mono text-zinc-500">@{item.username}</div>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 bg-[#0d0e10] px-1.5 py-0.5 rounded border border-white/[0.06]">
                    Profile
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Notifications + User profile */}
      <div className="flex items-center gap-2.5">
        {/* Notification Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-md bg-[#141618] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
            title="Notifications"
            aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00e5ff] px-1 font-mono text-[9px] font-bold text-[#08090a] shadow-sm">
                {unread <= 9 ? unread : "9+"}
              </span>
            )}
          </button>

          <NotificationPanel
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
          />
        </div>

        {/* User Chip */}
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-md bg-[#141618] border border-white/[0.08] hover:border-white/20 transition-colors"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#00e5ff]/15 font-mono text-[10px] font-bold text-[#00e5ff]">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-white leading-tight">
              {user?.name ?? "User"}
            </div>
            <div className="text-[10px] font-mono text-zinc-500 capitalize leading-tight">
              {user?.role ?? "member"}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
