"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthModal } from "./AuthModalContext";
import { getUser } from "@/lib/auth";

export default function HeroCTA() {
  const { openAuthModal } = useAuthModal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getUser());
  }, []);

  if (isLoggedIn) {
    return (
      <div className="pt-1 sm:pt-2 flex justify-center">
        <Link
          href="/dashboard"
          className="px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:bg-neutral-100 transition-all duration-200 shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_45px_rgba(255,255,255,0.45)] hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2"
        >
          <span>Go to Dashboard</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-1 sm:pt-2 flex justify-center">
      <button
        type="button"
        onClick={() => openAuthModal("signup")}
        className="px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:bg-neutral-100 transition-all duration-200 shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_45px_rgba(255,255,255,0.45)] hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
      >
        <span>Sign Up &amp; Build</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </button>
    </div>
  );
}
