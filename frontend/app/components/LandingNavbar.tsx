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
    <header className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="brand-mark">
          Creao<span>Link</span>
        </Link>

        <nav className="landing-nav-links" aria-label="Landing navigation">
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#how" className="transition-colors hover:text-white">
            How it works
          </a>
          <a href="#pricing" className="transition-colors hover:text-white">
            Pricing
          </a>
          <a href="#testimonials" className="transition-colors hover:text-white">
            Reviews
          </a>
        </nav>

        {user ? (
          <div className="landing-nav-actions">
            <Link
              href="/dashboard"
              className="cl-btn ghost"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/profile"
              className="cl-btn primary"
            >
              {getInitials(user.name)}
            </Link>
          </div>
        ) : (
          <div className="landing-nav-actions">
            <Link
              href="/auth/login"
              className="cl-btn ghost"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="cl-btn primary"
            >
              Start free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
