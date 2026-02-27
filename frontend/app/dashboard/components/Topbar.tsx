"use client";

import { User } from "@/lib/auth";

interface TopbarProps {
  user: User | null;
}

export default function Topbar({ user }: TopbarProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="h-14 border-b border-border bg-bg/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
      <div />

      {/* User info */}
      <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
