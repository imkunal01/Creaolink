"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUser, type User } from "@/lib/auth";

export default function FloatingNavbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const syncUser = () => setUser(getUser());
    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", syncUser);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 pt-4 sm:pt-6 pointer-events-none">
      <div className="mx-auto max-w-6xl rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between pointer-events-auto bg-[#090b0e]/70 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.7)]">
        {/* Left: Brand + Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="text-white font-bold text-base tracking-tight flex items-center">
              <span>w</span>
              <span className="text-[#22c55e] font-extrabold">&#123;task&#125;</span>
            </span>
          </Link>

          {/* Nav items directly adjacent to brand as in reference */}
          <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-zinc-300">
            <a href="#product" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#simulator" className="hover:text-white transition-colors">
              Earn as You Build
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              Workflow
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </div>
        </div>

        {/* Right: Auth Action Buttons */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-[13px] font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/projects"
                className="text-xs font-semibold px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                Enter App &rarr;
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-[13px] font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Log In</span>
              </Link>
              <Link
                href="/auth/signup"
                className="text-[13px] font-medium px-4 py-1.5 rounded-full bg-[#121418] hover:bg-[#1a1d24] border border-white/20 text-white transition-all shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
