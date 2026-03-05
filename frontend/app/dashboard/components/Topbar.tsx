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
    <header className="h-14 border-b border-border bg-bg/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shrink-0">
      {/* Left: hamburger on mobile */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 -ml-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Spacer for desktop (sidebar visible) */}
      <div className="hidden lg:block" />

      {/* User info — clicking profile icon goes to profile page */}
      <Link href="/dashboard/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-text-primary leading-tight">
            {user?.name ?? "User"}
          </p>
          <p className="text-xs text-text-tertiary leading-tight capitalize">
            {user?.role ?? "—"}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center">
          <span className="text-xs font-medium text-text-secondary">
            {initials}
          </span>
        </div>
      </Link>
    </header>
  );
}
