"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function MinimalFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-[#07080a] py-16 px-6 lg:px-12 text-sm text-neutral-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand info with logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-6 h-6 flex items-center justify-center rounded-md overflow-hidden bg-white/5 border border-white/10">
            <Image
              src="/favicon.ico"
              alt="Creaolink Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <span className="font-semibold text-white tracking-tight">
            Creaolink
          </span>
          <span className="text-neutral-600">/</span>
          <span className="text-xs text-neutral-500">
            Creative Pipeline Infrastructure
          </span>
        </div>

        {/* Status indicator & clean links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-neutral-300 font-mono">Systems Operational</span>
          </div>
          <Link
            href="/privacy"
            className="hover:text-white transition-colors text-neutral-500"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-white transition-colors text-neutral-500"
          >
            Terms
          </Link>
          <Link
            href="/security"
            className="hover:text-white transition-colors text-neutral-500"
          >
            Security
          </Link>
          <span className="text-neutral-600">
            &copy; {new Date().getFullYear()} Creaolink Inc.
          </span>
        </div>
      </div>
    </footer>
  );
}
