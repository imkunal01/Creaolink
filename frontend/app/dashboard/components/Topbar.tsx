"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { apiSearchUsers, type SearchUserItem } from "@/lib/api";

interface TopbarProps {
  user: User | null;
  onMenuToggle: () => void;
}

export default function Topbar({ user, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserItem[]>([]);
  const [loading, setLoading] = useState(false);

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
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur-sm px-4 sm:px-6">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 -ml-1 text-[#8b949e] hover:text-[#f0f6fc] transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="hidden md:block relative">
            <div className="flex items-center gap-2 rounded-md border border-[#30363d] bg-[#010409] px-3 py-1.5 min-w-[280px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8b949e]">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search users by username"
                className="w-full bg-transparent text-xs text-[#c9d1d9] placeholder:text-[#8b949e] outline-none"
              />
            </div>

            {(loading || results.length > 0) && (
              <div className="absolute left-0 right-0 mt-2 rounded-md border border-[#30363d] bg-[#010409] shadow-xl overflow-hidden">
                {loading ? (
                  <p className="px-3 py-2 text-xs text-[#8b949e]">Searching...</p>
                ) : (
                  results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                        router.push(`/dashboard/profile/${item.id}`);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#161b22] transition-colors"
                    >
                      <p className="text-sm text-[#f0f6fc]">{item.name}</p>
                      <p className="text-xs text-[#8b949e]">@{item.username}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <Link href="/dashboard/profile" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium leading-tight text-[#f0f6fc]">{user?.name ?? "User"}</p>
            <p className="text-xs leading-tight text-[#8b949e]">@{user?.username ?? "—"}</p>
          </div>
          <div className="h-8 w-8 rounded-full border border-[#30363d] bg-[#161b22] flex items-center justify-center">
            <span className="text-xs font-medium text-[#c9d1d9]">{initials}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
