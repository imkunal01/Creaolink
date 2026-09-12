import React from "react";
import MinimalNavbar from "./components/MinimalNavbar";
import HeroCTA from "./components/HeroCTA";
import LiquidBubbleCanvas from "./components/LiquidBubbleCanvas";
import FloatingHeroWidgets from "./components/FloatingHeroWidgets";
import MinimalSaaSGrid from "./components/MinimalSaaSGrid";
import MinimalMetrics from "./components/MinimalMetrics";
import MinimalFooter from "./components/MinimalFooter";
import ScenoxisSection from "./components/ScenoxisSection";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#07080a] text-white selection:bg-white/20 selection:text-white relative overflow-x-hidden font-sans">
      {/* ─────────────────────────────────────────────────────────────
          Top-Left Natural Atmospheric Sun Flare & Volumetric Light Beam
          ───────────────────────────────────────────────────────────── */}
      {/* Broad Ambient Sun Corona */}
      <div className="absolute -top-36 -left-36 sm:-top-48 sm:-left-48 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,248,225,0.4)_0%,_rgba(255,210,120,0.18)_25%,_rgba(255,160,60,0.06)_50%,_transparent_75%)] blur-[110px] pointer-events-none z-0" />

      {/* Sun Hotspot Core Light Glint */}
      <div className="absolute top-0 left-0 w-40 sm:w-56 h-40 sm:h-56 rounded-full bg-gradient-to-br from-white/70 via-amber-200/35 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Diagonal Volumetric Sun Beam */}
      <div className="absolute -top-24 -left-24 w-[900px] sm:w-[1300px] h-[500px] sm:h-[700px] -rotate-[30deg] origin-top-left bg-[conic-gradient(from_0deg_at_0%_0%,_transparent_0deg,_rgba(255,245,215,0.16)_20deg,_rgba(255,205,110,0.07)_40deg,_transparent_65deg)] blur-[80px] pointer-events-none z-0" />

      {/* Soft Cinematic Lens Halo */}
      <div className="absolute top-1/4 left-1/6 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-amber-400/[0.04] blur-2xl pointer-events-none z-0" />

      {/* Top Navbar */}
      <MinimalNavbar />

      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION (Full Viewport Height & Seamless Bottom Fade)
          ───────────────────────────────────────────────────────────── */}
      <section className="relative w-full h-[100dvh] min-h-[600px] flex flex-col justify-between pt-24 sm:pt-32 pb-0 overflow-hidden">
        {/* Hero Copy (Minimal, Impactful, Centered) */}
        <div className="relative z-20 max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-4 sm:space-y-5">

          {/* Scenoxis Powered-by Badge */}
          <div className="flex justify-center">
            <a
              href="https://scenoxis.in/"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.10] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.20] backdrop-blur-md transition-all duration-200 cursor-pointer"
            >
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                Powered by
              </span>
              <span
                className="text-[11px] font-bold tracking-wide"
                style={{
                  background: "linear-gradient(90deg, #fb923c, #ec4899, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Scenoxis
              </span>
              {/* Arrow */}
              <svg
                className="w-3 h-3 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-[64px] font-extrabold tracking-[-0.035em] text-white leading-[1.12]">
            Elevate Your Creative Workflow
          </h1>

          <p className="max-w-xl mx-auto text-xs sm:text-base text-neutral-400 font-normal leading-relaxed text-balance px-2">
            Unlock your studio&apos;s potential in a real-time synchronized
            pipeline, powered by Creaolink.
          </p>

          {/* Center Call to Action Floating Above Bubble Apex */}
          <HeroCTA />
        </div>

        {/* 3D Animated Liquid Bubble Canvas & Floating Glass Cards Container */}
        <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
          {/* Three.js Interactive Organic Liquid Bubble Orb */}
          <LiquidBubbleCanvas />

          {/* Floating Glassmorphic Metric Cards matching reference layout */}
          <div className="w-full max-w-7xl mx-auto relative h-full pointer-events-auto">
            <FloatingHeroWidgets />
          </div>

          {/* ─────────────────────────────────────────────────────────────
              Seamless Bottom Fade Gradient (Eliminates obvious cut line)
              ───────────────────────────────────────────────────────────── */}
          <div className="absolute bottom-0 inset-x-0 h-32 sm:h-48 bg-gradient-to-t from-[#07080a] via-[#07080a]/75 to-transparent pointer-events-none z-10" />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SaaS Performance Metrics Strip
          ───────────────────────────────────────────────────────────── */}
      <MinimalMetrics />

      {/* ─────────────────────────────────────────────────────────────
          Minimalist SaaS Value Architecture & Pipeline Console
          ───────────────────────────────────────────────────────────── */}
      <MinimalSaaSGrid />

      {/* ─────────────────────────────────────────────────────────────
          Powered by Scenoxis
          ───────────────────────────────────────────────────────────── */}
      <ScenoxisSection />

      {/* ─────────────────────────────────────────────────────────────
          Ultra-Clean Minimalist Footer
          ───────────────────────────────────────────────────────────── */}
      <MinimalFooter />
    </main>
  );
}
