"use client";

import Link from "next/link";
import { User } from "@/lib/auth";

interface TopbarProps {
  user: User | null;
  onMenuToggle: () => void;
}

export default function Topbar({ user, onMenuToggle }: TopbarProps) {
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

          <div className="hidden md:flex items-center gap-2 rounded-md border border-[#30363d] bg-[#010409] px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8b949e]">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="text-xs text-[#8b949e]">Search projects</span>
          </div>
        </div>

        <Link href="/dashboard/profile" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium leading-tight text-[#f0f6fc]">{user?.name ?? "User"}</p>
            <p className="text-xs leading-tight capitalize text-[#8b949e]">{user?.role ?? "—"}</p>
          </div>
          <div className="h-8 w-8 rounded-full border border-[#30363d] bg-[#161b22] flex items-center justify-center">
            <span className="text-xs font-medium text-[#c9d1d9]">{initials}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
