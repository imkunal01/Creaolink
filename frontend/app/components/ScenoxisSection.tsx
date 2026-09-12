import React from "react";
import Image from "next/image";
import Link from "next/link";

const SERVICES = [
  { label: "3D Animation" },
  { label: "Video Editing" },
  { label: "Web Development" },
  { label: "Brand Identity" },
  { label: "Motion Design" },
  { label: "Creative Direction" },
];

export default function ScenoxisSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Subtle ambient glow matching Scenoxis gradient palette */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.06)_0%,rgba(168,85,247,0.04)_40%,transparent_70%)] blur-[80px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 relative z-10">

        {/* Top label */}
        <div className="flex justify-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-[11px] font-mono font-medium tracking-widest text-white/40 uppercase">
            Powered by
          </span>
        </div>

        {/* Center: Logo + Name + tagline */}
        <div className="flex flex-col items-center text-center gap-6 sm:gap-8">
          
          {/* Logo + wordmark row */}
          <Link
            href="https://scenoxis.in/"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 sm:gap-5"
          >
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[8deg]">
              <Image
                src="/ScenoxisWhite.png"
                alt="Scenoxis"
                fill
                className="object-contain drop-shadow-[0_0_20px_rgba(236,72,153,0.4)] group-hover:drop-shadow-[0_0_32px_rgba(236,72,153,0.65)] transition-all duration-500"
              />
            </div>
            <span className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-white group-hover:text-white/90 transition-colors">
              Scenoxis
            </span>
          </Link>

          {/* One-liner */}
          <p className="max-w-sm text-white/50 text-sm sm:text-base font-light leading-relaxed">
            A full-service creative agency turning ideas into motion, identity, and experience.
          </p>

          {/* Service pills — horizontal scroll on mobile */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
            {SERVICES.map((s) => (
              <span
                key={s.label}
                className="px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white/90 hover:border-white/20 transition-colors cursor-default"
              >
                {s.label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="https://scenoxis.in/"
            target="_blank"
            rel="noreferrer"
            className="group mt-2 inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 text-white text-sm font-medium transition-all duration-300 hover:scale-[1.03]"
          >
            <span>Explore Scenoxis</span>
            <svg
              className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </Link>
        </div>

        {/* Hairline divider below */}
        <div className="mt-16 sm:mt-20 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>
    </section>
  );
}
