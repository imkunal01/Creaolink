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
  const [user, setUser] = useState<User | null>(() => getUser());

  useEffect(() => {
    const refreshUser = () => {
      setUser(getUser());
    };

    window.addEventListener("storage", refreshUser);
    window.addEventListener("focus", refreshUser);

    return () => {
      window.removeEventListener("storage", refreshUser);
      window.removeEventListener("focus", refreshUser);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          CreaoLink
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-gray-300 md:flex">
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#about" className="transition-colors hover:text-white">
            About
          </a>
          <a href="#events" className="transition-colors hover:text-white">
            Events
          </a>
          <a href="#contact" className="transition-colors hover:text-white">
            Contact
          </a>
        </nav>

        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 rounded-lg border border-white/20 bg-black/20 px-2.5 py-1.5 transition-colors hover:border-white/40"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm leading-tight text-text-primary">{user.name}</p>
              </div>
              <div className="h-8 w-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                <span className="text-xs font-medium text-text-primary">
                  {getInitials(user.name)}
                </span>
              </div>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition-transform hover:scale-[1.02]"
            >
              Start free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
