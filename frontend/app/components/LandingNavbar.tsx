"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUser, type User } from "@/lib/auth";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function LandingNavbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const refreshUser = () => {
      setUser(getUser());
    };

    refreshUser();

    window.addEventListener("storage", refreshUser);
    window.addEventListener("focus", refreshUser);

    return () => {
      window.removeEventListener("storage", refreshUser);
      window.removeEventListener("focus", refreshUser);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#07080a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#00e5ff] to-[#0077b6] text-[#050d12] shadow-[0_0_15px_rgba(0,229,255,0.35)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            Creao<span className="text-[#00e5ff]">Link</span>
          </span>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400" aria-label="Main Navigation">
          <a href="#features" className="hover:text-white transition-colors">
            Capabilities
          </a>
          <a href="#how" className="hover:text-white transition-colors">
            Workflow
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
          <a href="#testimonials" className="hover:text-white transition-colors">
            Reviews
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="saas-btn-secondary text-xs h-8 px-3"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00e5ff]/15 font-mono text-xs font-bold text-[#00e5ff] border border-[#00e5ff]/30 hover:shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-all"
              >
                {getInitials(user.name)}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-xs font-medium text-zinc-400 hover:text-white px-2 py-1 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="saas-btn-cyan text-xs h-8 px-3.5"
              >
                Start free &rarr;
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
