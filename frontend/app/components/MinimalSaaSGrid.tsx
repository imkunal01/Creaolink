"use client";

import React, { useState } from "react";
import Link from "next/link";

const capabilities = [
  {
    id: "sync",
    badge: "Real-Time Bridge",
    title: "Non-Destructive Sequence Mirror",
    desc: "Sync active Adobe Premiere Pro & DaVinci timelines into cloud sequences without exporting hefty gigabyte files.",
    stat: "< 48ms",
    statLabel: "Sync latency",
  },
  {
    id: "review",
    badge: "Precision Feedback",
    title: "Frame-Accurate Timecode Anchors",
    desc: "Clients drop spatial drawings and notes pinned to exact timecodes. Comments stream directly into your NLE marker panel.",
    stat: "100%",
    statLabel: "Frame accuracy",
  },
  {
    id: "orchestrate",
    badge: "Cloud Pipeline",
    title: "Instant Video Transcoding & HLS Stream",
    desc: "Stream proxy sequences instantly with adaptive bitrates. No local render bottlenecks or client codec incompatibilities.",
    stat: "4.2x",
    statLabel: "Faster turnarounds",
  },
];

export default function MinimalSaaSGrid() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="features" className="relative z-10 py-24 sm:py-32 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Section Header: Minimalist & Focused */}
      <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
        <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 block mb-3">
          Architecture
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
          Engineered for frictionless creative velocity.
        </h2>
        <p className="mt-4 text-neutral-400 text-sm sm:text-base leading-relaxed">
          Eliminate export delays, redundant revisions, and manual syncing. Creaolink connects your timeline directly to your team.
        </p>
      </div>

      {/* 3-Card Minimalist Glass Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20">
        {capabilities.map((item, idx) => (
          <div
            key={item.id}
            className="group relative p-8 rounded-3xl bg-[#0f1016]/40 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Ambient inner glow on hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10">
                  {item.badge}
                </span>
                <span className="text-xs font-mono text-neutral-500">0{idx + 1}</span>
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight mb-3 group-hover:text-white transition-colors">
                {item.title}
              </h3>

              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                {item.desc}
              </p>
            </div>

            <div className="pt-6 border-t border-white/[0.06] flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {item.stat}
                </div>
                <div className="text-xs text-neutral-500 font-mono">
                  {item.statLabel}
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/[0.05] group-hover:bg-white text-neutral-400 group-hover:text-black flex items-center justify-center transition-all duration-200">
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Minimalist Timeline & Bridge Console */}
      <div className="relative p-6 sm:p-10 rounded-3xl bg-[#0c0d12]/60 backdrop-blur-2xl border border-white/[0.08] overflow-hidden">
        {/* Top Console Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-mono text-neutral-300">
              Live Session: timeline_sequence_cut_v4.prproj
            </span>
          </div>

          {/* Interactive Mode Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.05] border border-white/10 self-start sm:self-auto">
            {["Sequence Bridge", "Frame Markers", "Cloud Output"].map(
              (tab, index) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(index)}
                  className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    activeTab === index
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        {/* Dynamic Interactive Demo Panel */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
              {activeTab === 0 && "Active Direct Connection"}
              {activeTab === 1 && "Precision Timecode Anchoring"}
              {activeTab === 2 && "Automated Stream Generation"}
            </span>
            <h4 className="text-2xl font-bold text-white tracking-tight">
              {activeTab === 0 && "Sub-second changes mirrored to stakeholder previews."}
              {activeTab === 1 && "No more 'at around 1 minute 14 seconds' emails."}
              {activeTab === 2 && "Adaptive 4K streams ready before you finish the cut."}
            </h4>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {activeTab === 0 &&
                "The Creaolink UXP extension reads timeline cut points, audio levels, and LUT metadata in real-time, synchronizing playback with ultra-low latency."}
              {activeTab === 1 &&
                "Feedback automatically populates as NLE sequence markers with author, timestamp, and visual overlay annotations directly inside Premiere Pro."}
              {activeTab === 2 &&
                "Distributed edge workers generate high-fidelity HLS streams on the fly, saving hours of manual rendering and upload bandwidth."}
            </p>
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <a
                href="/api/plugin/download?format=ccx"
                download="creaolink-premiere-v1.0.0.ccx"
                className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-100 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Plugin (.ccx)</span>
              </a>

              <Link
                href="/premiere-setup"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <span>Setup Guide &amp; Docs</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="transition-transform group-hover:translate-x-1"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Minimalist Visual Simulation */}
          <div className="lg:col-span-7 bg-[#07080b] rounded-2xl p-5 border border-white/[0.06] space-y-4 font-mono text-xs">
            {/* Mock Timeline Wave / Track */}
            <div className="flex items-center justify-between text-neutral-500 pb-2 border-b border-white/[0.04]">
              <span>TIMECODE 00:01:24:18</span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CONNECTED 24 FPS
              </span>
            </div>

            {/* Simulated Tracks */}
            <div className="space-y-2 py-2">
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 w-8 text-[11px]">V1</span>
                <div className="flex-1 h-7 rounded-lg bg-neutral-800/80 border border-white/10 flex items-center px-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-neutral-700/50 border-r border-white/10" />
                  <div className="absolute left-1/3 top-0 bottom-0 w-1/2 bg-neutral-600/40 border-r border-white/10" />
                  <span className="relative z-10 text-[11px] text-neutral-300">
                    A-Roll_Interview_04.mov
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-neutral-500 w-8 text-[11px]">V2</span>
                <div className="flex-1 h-7 rounded-lg bg-neutral-800/40 border border-white/5 flex items-center px-3 relative overflow-hidden">
                  <div className="absolute left-1/4 top-0 bottom-0 w-1/4 bg-amber-500/20 border border-amber-500/30 rounded" />
                  <span className="relative z-10 text-[11px] text-amber-200">
                    B-Roll_Overlay_Product.mov
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-neutral-500 w-8 text-[11px]">A1</span>
                <div className="flex-1 h-6 rounded-lg bg-neutral-800/60 border border-white/5 flex items-center px-3">
                  <span className="text-[11px] text-neutral-400">
                    Dialogue_Clean_Normalized.wav (Stereo)
                  </span>
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-white/[0.04]">
              <span>Cloud Sync: Active (0 dropped frames)</span>
              <span className="text-neutral-300">Version 2.4.0</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
