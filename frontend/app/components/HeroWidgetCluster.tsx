"use client";

import { useState } from "react";

export default function HeroWidgetCluster() {
  const [activeTile, setActiveTile] = useState(1);

  return (
    <div className="relative w-full max-w-2xl mx-auto flex items-center justify-center py-6 select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. High-Intensity Scarlet Red Nebula Bloom & Amber Glow
          ───────────────────────────────────────────────────────────── */}
      <div className="hero-crimson-nebula" />
      <div className="hero-amber-subglow" />

      {/* ─────────────────────────────────────────────────────────────
          2. SVG Circuit Board Traces & Constellation Nodes (Background)
          ───────────────────────────────────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40"
        viewBox="0 0 600 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle grid of tiny dots */}
        <pattern id="dot-matrix" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.08)" />
        </pattern>
        <rect width="600" height="500" fill="url(#dot-matrix)" />

        {/* Circuit Traces with 90° corners */}
        <path
          d="M 120 180 L 190 180 L 190 90 L 320 90"
          stroke="rgba(251, 146, 60, 0.35)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <circle cx="120" cy="180" r="3" fill="#fb923c" />
        <circle cx="320" cy="90" r="3" fill="#fb923c" />

        <path
          d="M 450 70 L 510 70 L 510 160 L 550 160"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="1.5"
        />
        <circle cx="450" cy="70" r="3" fill="#ef4444" />
        <circle cx="550" cy="160" r="3.5" fill="#ef4444" />

        <path
          d="M 380 340 L 460 340 L 460 410 L 520 410"
          stroke="rgba(251, 146, 60, 0.25)"
          strokeWidth="1.5"
        />
        <circle cx="520" cy="410" r="3" fill="#fb923c" />

        {/* Circuit integrated chip outline in faint background */}
        <rect
          x="460"
          y="100"
          width="40"
          height="40"
          rx="6"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <line x1="450" y1="110" x2="460" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <line x1="450" y1="120" x2="460" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <line x1="450" y1="130" x2="460" y2="130" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <line x1="500" y1="110" x2="510" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <line x1="500" y1="120" x2="510" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <line x1="500" y1="130" x2="510" y2="130" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      </svg>

      {/* ─────────────────────────────────────────────────────────────
          3. Rightmost Control Elements: Vertical Slider + Mouse Scroll
          ───────────────────────────────────────────────────────────── */}
      {/* Far Right Vertical Slider Track */}
      <div className="absolute right-0 sm:right-2 top-1/2 -translate-y-12 z-20 hidden md:flex flex-col items-center">
        <div className="w-2.5 h-36 rounded-full bg-[#0a0c10]/80 border border-white/10 p-0.5 flex flex-col justify-end shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          <div className="w-full h-24 bg-gradient-to-t from-rose-500 via-orange-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.7)]" />
        </div>
      </div>

      {/* Bottom Right Mouse Scroll Wheel Icon */}
      <div className="absolute right-2 sm:right-4 bottom-2 z-20 hidden md:flex items-center justify-center">
        <div className="w-6 h-9 rounded-full border border-white/20 bg-[#0d0f14]/80 flex items-start justify-center pt-2 shadow-[0_4px_15px_rgba(0,0,0,0.6)]">
          <div className="w-1 h-2 rounded-full bg-white/80 animate-pulse" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. Main Interactive Floating Composition Container
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center space-y-4">
        {/* TOP ROW: 3 Amber Glowing Square Tiles */}
        <div className="flex items-center gap-4 self-center pl-4 sm:pl-8">
          {/* Tile 1: 4-dot diamond pattern */}
          <button
            type="button"
            onClick={() => setActiveTile(0)}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl reference-tile flex items-center justify-center transition-all ${activeTile === 0 ? "ring-2 ring-amber-500/50 scale-105" : ""
              }`}
          >
            <div className="grid grid-cols-2 gap-1.5 p-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,146,60,0.9)]" />
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,146,60,0.9)]" />
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,146,60,0.9)]" />
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,146,60,0.9)]" />
            </div>
          </button>

          {/* Tile 2: CPU Microchip with glowing core */}
          <button
            type="button"
            onClick={() => setActiveTile(1)}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl reference-tile flex items-center justify-center transition-all ${activeTile === 1 ? "ring-2 ring-amber-500/50 scale-105" : ""
              }`}
          >
            <div className="relative flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-amber-400">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" />
                <rect x="8" y="8" width="8" height="8" rx="1" fill="#f59e0b" className="shadow-[0_0_10px_#f59e0b]" />
                <line x1="9" y1="1" x2="9" y2="4" stroke="currentColor" />
                <line x1="15" y1="1" x2="15" y2="4" stroke="currentColor" />
                <line x1="9" y1="20" x2="9" y2="23" stroke="currentColor" />
                <line x1="15" y1="20" x2="15" y2="23" stroke="currentColor" />
                <line x1="20" y1="9" x2="23" y2="9" stroke="currentColor" />
                <line x1="20" y1="15" x2="23" y2="15" stroke="currentColor" />
                <line x1="1" y1="9" x2="4" y2="9" stroke="currentColor" />
                <line x1="1" y1="15" x2="4" y2="15" stroke="currentColor" />
              </svg>
            </div>
          </button>

          {/* Tile 3: Folder Icon */}
          <button
            type="button"
            onClick={() => setActiveTile(2)}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl reference-tile flex items-center justify-center transition-all ${activeTile === 2 ? "ring-2 ring-amber-500/50 scale-105" : ""
              }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" fill="rgba(245, 158, 11, 0.25)" />
            </svg>
          </button>
        </div>

        {/* MIDDLE SECTION: Floating 3D Red Dial + Main Tablet Card + Right Feature Card */}
        <div className="relative w-full flex items-start justify-center gap-3 sm:gap-4">
          {/* FLOATING RED DIAL (Positioned in hot crimson nebula to the left) */}
          <div className="absolute -left-5 sm:-left-8 top-12 z-30">
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full red-dial-knob flex items-center justify-center relative cursor-pointer hover:scale-105 transition-transform">
              {/* Inner recessed circle */}
              <div className="w-8 h-8 rounded-full bg-[#1b060a] border border-rose-500/50 flex items-center justify-center relative shadow-inner">
                {/* Glowing red 5-dot crossmark ✛ */}
                <div className="relative flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" />
                  <span className="absolute -top-2.5 w-1 h-1 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
                  <span className="absolute -bottom-2.5 w-1 h-1 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
                  <span className="absolute -left-2.5 w-1 h-1 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
                  <span className="absolute -right-2.5 w-1 h-1 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
                </div>
              </div>
            </div>
          </div>

          {/* MAIN FROSTED GLASS TABLET */}
          <div className="flex-1 max-w-[340px] sm:max-w-[370px] reference-glass-card rounded-3xl p-5 sm:p-6 relative z-10">
            <div className="flex items-stretch gap-4">
              {/* Left Column Rail: Gauge + Bar Chart + Dots */}
              <div className="flex flex-col items-center justify-between py-1 pr-3 border-r border-white/[0.08] text-zinc-400">
                {/* Curved gauge icon ◔ */}
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-zinc-400">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fb923c" strokeWidth="2.5" />
                  </svg>
                </div>

                {/* Vertical Bar Chart / Equalizer (3-4 bars) */}
                <div className="flex items-end gap-1 h-10 py-1">
                  <span className="w-1 h-3 rounded-full bg-zinc-500" />
                  <span className="w-1 h-6 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,146,60,0.6)]" />
                  <span className="w-1 h-8 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                  <span className="w-1 h-4 rounded-full bg-amber-400" />
                </div>

                {/* Matrix dots */}
                <div className="grid grid-cols-2 gap-1">
                  <span className="w-1 h-1 rounded-full bg-zinc-400" />
                  <span className="w-1 h-1 rounded-full bg-zinc-400" />
                  <span className="w-1 h-1 rounded-full bg-zinc-400" />
                  <span className="w-1 h-1 rounded-full bg-zinc-400" />
                </div>
              </div>

              {/* Right Column: 3 Checklist Items */}
              <div className="flex-1 space-y-4">
                {/* Item 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full glowing-amber-check flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-4/5 bg-white/20 rounded-full" />
                    <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full glowing-amber-check flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-3/4 bg-white/20 rounded-full" />
                    <div className="h-2 w-2/5 bg-white/10 rounded-full" />
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full glowing-amber-check flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-5/6 bg-white/20 rounded-full" />
                    <div className="h-2 w-3/5 bg-white/10 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Dark Capsule Container */}
            <div className="mt-5 pt-4 border-t border-white/[0.08]">
              <div className="h-7 w-full rounded-xl bg-black/40 border border-white/[0.06] flex items-center px-3 justify-between">
                <div className="h-2 w-20 bg-white/20 rounded-full" />
                <div className="h-2 w-10 bg-amber-400/40 rounded-full" />
              </div>
            </div>
          </div>

          {/* RIGHT FLOATING FEATURE CARD */}
          <div className="hidden sm:flex flex-col max-w-[200px] reference-glass-card rounded-2xl p-4 space-y-3 relative z-20 self-center -ml-4 shadow-2xl">
            {/* Gear Icon Badge */}
            <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-zinc-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>

            {/* Paragraph Text Matching Screenshot */}
            <p className="text-[11px] text-zinc-300 leading-relaxed font-normal">
              WhatTask is an AI-powered platform where virtual employees execute tasks, collaborate, and optimize workflows in real-time.
            </p>
          </div>
        </div>

        {/* BOTTOM SECTION: Lower Floating Card with Amber Slider & Checklist Grid */}
        <div className="w-full max-w-[390px] reference-glass-card rounded-2xl p-4 space-y-3 relative z-10">
          {/* Top Row: Amber Progress Slider Line */}
          <div className="flex items-center gap-3">
            {/* Glowing amber node / handle */}
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] ring-2 ring-amber-500/40 shrink-0" />

            {/* Glowing Progress Line + Inactive Track */}
            <div className="flex-1 flex items-center">
              <div className="w-28 sm:w-36 h-1.5 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              <div className="flex-1 h-1 bg-white/10 rounded-r-full" />
            </div>

            {/* Status indicator bar */}
            <div className="h-2 w-12 bg-white/15 rounded-full" />
          </div>

          {/* Bottom 2x2 Checklist Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full glowing-amber-check flex items-center justify-center shrink-0">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="h-2 w-16 bg-white/20 rounded-full" />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full glowing-amber-check flex items-center justify-center shrink-0">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="h-2 w-20 bg-white/20 rounded-full" />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full glowing-amber-check flex items-center justify-center shrink-0">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="h-2 w-14 bg-white/20 rounded-full" />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full glowing-amber-check flex items-center justify-center shrink-0">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="h-2 w-16 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
