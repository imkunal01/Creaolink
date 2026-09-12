"use client";

import React, { useState } from "react";

export default function FloatingHeroWidgets() {
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          Left Card: Visible on Desktop & Mobile (Centered on Mobile)
          Ultra-Translucent See-Through Glassmorphism
          ───────────────────────────────────────────────────────────── */}
      <div
        onMouseEnter={() => setHoverLeft(true)}
        onMouseLeave={() => setHoverLeft(false)}
        className="absolute left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-10 lg:left-16 bottom-8 sm:bottom-36 lg:bottom-44 z-20 transition-all duration-500 transform hover:-translate-y-1 w-[90%] max-w-[320px] sm:w-72"
      >
        <div className="relative group cursor-pointer p-4 sm:p-5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.045] backdrop-blur-sm sm:backdrop-blur-md border border-white/[0.08] hover:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300">
          {/* Very Subtle Ambient Shimmer */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-medium tracking-wide text-neutral-300/80">
              Pipeline Sync
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/[0.06] group-hover:bg-white text-neutral-300 group-hover:text-black flex items-center justify-center transition-all duration-200">
              <svg
                width="10"
                height="10"
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
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-[13px] sm:text-[15px] font-semibold text-white/95 tracking-tight leading-snug">
              Instant Sequence Sync &amp; Zero-Render
            </h4>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] sm:text-[11px] font-mono text-neutral-400">
                Latency: &lt;48ms
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400">
                +98.2%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Right Card: Desktop Only (Hidden on Mobile Screens)
          Ultra-Translucent See-Through Glassmorphism
          ───────────────────────────────────────────────────────────── */}
      <div
        onMouseEnter={() => setHoverRight(true)}
        onMouseLeave={() => setHoverRight(false)}
        className="hidden sm:block absolute right-10 lg:right-16 bottom-28 lg:bottom-36 z-20 transition-all duration-500 transform hover:-translate-y-1 w-72"
      >
        <div className="relative group cursor-pointer p-5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.045] backdrop-blur-md border border-white/[0.08] hover:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300">
          {/* Very Subtle Ambient Shimmer */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium tracking-wide text-neutral-300/80">
              Workflow Efficiency
            </span>
            <div className="w-6 h-6 rounded-full bg-white/[0.06] group-hover:bg-white text-neutral-300 group-hover:text-black flex items-center justify-center transition-all duration-200">
              <svg
                width="11"
                height="11"
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
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              96%
            </div>
            {/* Glowing progress meter */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-neutral-200 via-white to-neutral-300 rounded-full w-[96%] shadow-[0_0_10px_rgba(255,255,255,0.6)] transition-all duration-1000" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
