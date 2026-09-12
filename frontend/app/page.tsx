import Link from "next/link";
import type { ReactNode } from "react";
import LandingNavbar from "./components/LandingNavbar";

const stats = [
  { value: "12,500+", label: "Active workspaces", change: "+42% this quarter" },
  { value: "48,000+", label: "Sequences synced", change: "Premiere Pro 2026" },
  { value: "3.2 hrs", label: "Avg. feedback turnaround", change: "vs 2.4 days email" },
  { value: "99.9%", label: "Sync reliability", change: "Real-time telemetry" },
];

const bentoFeatures = [
  {
    tag: "Signature Bridge",
    title: "Premiere Pro UXP Plugin Sync",
    description:
      "Broadcast video tracks, audio stems, clip durations, and timeline markers directly from Premiere Pro into a live collaborative web review room.",
    colSpan: "lg:col-span-2",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    preview: (
      <div className="mt-4 p-3 rounded-lg bg-[#07080a] border border-white/[0.08] font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-white/[0.06] pb-2">
          <span>SEQUENCE: Commercial_Reel_2026.prproj</span>
          <span className="text-[#00e5ff] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
            24.00 fps
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-8 text-[10px] text-sky-400 font-semibold">V1</span>
            <div className="flex-1 h-6 rounded bg-sky-500/20 border border-sky-500/40 flex items-center px-2 text-[10px] text-sky-200 truncate">
              Hero_Graded_A01_v3.mov [00:00 - 00:45]
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 text-[10px] text-emerald-400 font-semibold">A1</span>
            <div className="flex-1 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center px-2 text-[10px] text-emerald-200 truncate">
              Dialogue_Master_Mix_48kHz.wav
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Precision Review",
    title: "Frame-Accurate Timecodes",
    description:
      "Drop notes directly on exact timecodes (00:01:24:12). No more vague notes or manual transcription.",
    colSpan: "lg:col-span-1",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    preview: (
      <div className="mt-4 p-3 rounded-lg bg-[#07080a] border border-white/[0.08] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400 font-semibold">@ 01:24:12</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase">
            Color Grade
          </span>
        </div>
        <p className="text-xs text-zinc-300">
          "Tone down highlight saturation on the hero portrait."
        </p>
      </div>
    ),
  },
  {
    tag: "Version Safety",
    title: "Version History Stack",
    description:
      "Publish revision cuts (v1, v2, Final) with render logs. Past review threads and resolved markers remain intact.",
    colSpan: "lg:col-span-1",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    preview: (
      <div className="mt-4 p-3 rounded-lg bg-[#07080a] border border-white/[0.08] space-y-1.5 font-mono text-xs">
        <div className="flex items-center justify-between text-white">
          <span className="font-semibold text-[#00e5ff]">v3.0 Cut</span>
          <span className="text-[10px] text-zinc-500">Active</span>
        </div>
        <div className="flex items-center justify-between text-zinc-500 text-[11px]">
          <span>v2.1 Revision</span>
          <span>Archived</span>
        </div>
      </div>
    ),
  },
  {
    tag: "Role Isolation",
    title: "Dedicated Client & Editor Views",
    description:
      "Clients receive an intuitive approval dashboard. Editors get deep sequence telemetry and timeline markers.",
    colSpan: "lg:col-span-1",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </svg>
    ),
    preview: (
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded bg-[#07080a] border border-white/[0.08] text-white">
          <div className="text-[10px] text-zinc-500">Client Mode</div>
          <div className="font-semibold text-emerald-400 mt-0.5">Approve Cut</div>
        </div>
        <div className="p-2 rounded bg-[#07080a] border border-white/[0.08] text-white">
          <div className="text-[10px] text-zinc-500">Editor Mode</div>
          <div className="font-semibold text-[#00e5ff] mt-0.5">Sync UXP</div>
        </div>
      </div>
    ),
  },
  {
    tag: "Live Telemetry",
    title: "Real-Time Editor Presence",
    description:
      "Track live editing states, active sequence focus, and logged hours across editors and colorists.",
    colSpan: "lg:col-span-1",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      </svg>
    ),
    preview: (
      <div className="mt-4 p-3 rounded-lg bg-[#07080a] border border-white/[0.08] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white">Alex M.</span>
        </div>
        <span className="text-zinc-400 text-[11px]">Online &middot; In Cut</span>
      </div>
    ),
  },
];

const steps = [
  {
    num: "01",
    title: "Initialize Project Room",
    description:
      "Create a workspace, define the target delivery schedule, and invite editors and clients with isolated permissions.",
  },
  {
    num: "02",
    title: "Connect Premiere Pro Panel",
    description:
      "Enter your workspace sync token into the CreaoLink Premiere Pro UXP extension to broadcast tracks and markers.",
  },
  {
    num: "03",
    title: "Resolve & Approve Deliverables",
    description:
      "Clients review cuts on precise timecodes, editors resolve notes directly, and the final deliverable is locked.",
  },
];

const outcomes = [
  {
    tag: "Post-Production Studios",
    value: "38%",
    label: "Faster Cut Approvals",
    description:
      "Frame-accurate markers and versioned review rooms eliminate scattered email feedback chains.",
  },
  {
    tag: "Freelance Editors",
    value: "3.4x",
    label: "Clearer Feedback Briefs",
    description:
      "Structured timestamped feedback means editors spend time editing rather than clarifying revision requests.",
  },
  {
    tag: "Agency Producers",
    value: "45%",
    label: "Fewer Revision Iterations",
    description:
      "Visual timeline inspection and marker notes keep directors, editors, and clients aligned on every cut.",
  },
];

const testimonials = [
  {
    initials: "AM",
    name: "Arjun Mehra",
    role: "Post-Production Supervisor &middot; BlueOrbit Studio",
    quote:
      "The Premiere Pro timeline sync is game-changing. Our clients inspect markers and leave notes on exact timecodes without needing Premiere installed.",
  },
  {
    initials: "SR",
    name: "Simran Rao",
    role: "Senior Video Editor & Colorist",
    quote:
      "Converting client comments into trackable timecode items saved us hours of back-and-forth. The interface is exceptionally fast and clean.",
  },
  {
    initials: "KD",
    name: "Kavya Dalal",
    role: "Head of Creative &middot; PixelCraft Media",
    quote:
      "We onboarded our entire remote editing pod in a day. The version stack and live presence telemetry give us total delivery clarity.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "Forever",
    description: "For individual video editors and clients getting started with timeline sync.",
    points: ["Up to 3 active project rooms", "Full Premiere Pro timeline sync", "Timestamped feedback tracking", "Public creator portfolio"],
    featured: false,
    cta: "Start Free",
  },
  {
    name: "Growth",
    price: "₹499",
    period: "/ month",
    description: "For active freelance editors and boutique post-production studios.",
    points: ["15 active project rooms", "Up to 5 team collaborators", "Version-safe approval gates", "Priority timeline sync", "Real-time presence telemetry", "Custom feedback presets"],
    featured: true,
    cta: "Start 14-Day Free Trial",
  },
  {
    name: "Business",
    price: "₹1,499",
    period: "/ month",
    description: "For high-volume creative agencies and commercial production houses.",
    points: ["Unlimited project rooms", "Unlimited collaborators", "Custom review stages", "Dedicated account engineer", "Full API & webhook integration", "Enterprise SLA guarantee"],
    featured: false,
    cta: "Get Business",
  },
];

function SectionHeader({
  badge,
  title,
  subtitle,
  centered = true,
}: {
  badge: string;
  title: ReactNode;
  subtitle?: string;
  centered?: boolean;
}) {
  return (
    <div className={`space-y-3 mb-12 ${centered ? "text-center mx-auto max-w-3xl" : "max-w-2xl"}`}>
      <span className="saas-pill saas-pill-cyan font-mono text-[11px] uppercase tracking-wider">
        {badge}
      </span>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07080a] text-white selection:bg-[#00e5ff]/20">
      <LandingNavbar />

      <main className="relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-mesh pointer-events-none -z-10" />

        {/* ── 1. HERO SECTION ── */}
        <section className="relative pt-16 sm:pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-zinc-300 mb-8 shadow-inner hover:border-white/20 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-[#00e5ff] animate-pulse" />
            <span>Adobe Premiere Pro 2026 UXP Bridge Active</span>
            <span className="text-zinc-600">&middot;</span>
            <span className="text-[#00e5ff]">v2.4 Live</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            The collaborative review workspace bridging{" "}
            <span className="bg-gradient-to-r from-[#00e5ff] via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Premiere Pro
            </span>{" "}
            and clients.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Sync sequence timelines directly from Premiere Pro into real-time web review rooms. Leave frame-accurate notes, track revisions, and get client sign-off with zero miscommunication.
          </p>

          {/* Action CTAs */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
            <Link href="/auth/signup" className="saas-btn-cyan text-sm h-11 px-6 shadow-lg">
              Create Free Workspace &rarr;
            </Link>
            <Link href="/auth/login" className="saas-btn-secondary text-sm h-11 px-5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Explore Live Demo
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500">
            <div className="flex -space-x-2">
              {["AK", "SR", "MP", "JL"].map((av) => (
                <div
                  key={av}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1c1e22] border-2 border-[#07080a] font-mono text-[9px] font-bold text-zinc-300"
                >
                  {av}
                </div>
              ))}
            </div>
            <p>
              Adopted by <strong className="text-zinc-200">1,200+ video editors, colorists & studios</strong>
            </p>
          </div>

          {/* ── Interactive Workspace Mockup ── */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            {/* Ambient window glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#00e5ff]/20 via-sky-500/10 to-indigo-500/20 blur-xl opacity-60 pointer-events-none" />

            <div className="relative rounded-2xl border border-white/[0.12] bg-[#0c0e12]/90 backdrop-blur-2xl shadow-2xl overflow-hidden text-left">
              {/* Window Titlebar */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#08090a] border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#141618] border border-white/[0.06] font-mono text-[11px] text-zinc-400">
                  <span className="text-[#00e5ff]">app.creaolink.com</span>
                  <span>/workspace/commercial-reel-2026</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sync Active
                </div>
              </div>

              {/* Mock App Body */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      Commercial Reel 2026 — Master Cut
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      Premiere Pro Sequence: <span className="text-[#00e5ff]">Commercial_Final_v3.prproj</span> (24.00 fps)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="px-2.5 py-1 rounded bg-[#141618] border border-white/[0.08] text-zinc-300">
                      <span className="text-zinc-500 mr-1.5">POS</span>
                      <span className="text-[#00e5ff] font-semibold">00:01:24:12</span>
                    </div>
                    <div className="px-2.5 py-1 rounded bg-[#141618] border border-white/[0.08] text-zinc-300">
                      <span className="text-zinc-500 mr-1.5">DUR</span>
                      <span>00:03:45:00</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Timeline Tracks */}
                <div className="rounded-xl border border-white/[0.08] bg-[#07080a] overflow-hidden">
                  {/* Timeline Ruler */}
                  <div className="h-6 bg-[#101216] border-b border-white/[0.08] px-3 flex items-center justify-between font-mono text-[9px] text-zinc-500 select-none">
                    <span>00:00</span>
                    <span>00:30</span>
                    <span className="text-[#00e5ff] font-semibold">01:24 (Playhead)</span>
                    <span>02:00</span>
                    <span>02:30</span>
                    <span>03:00</span>
                  </div>

                  <div className="p-3 space-y-2 relative">
                    {/* Scrubbing Playhead Line */}
                    <div className="absolute top-0 bottom-0 left-[42%] w-px bg-[#00e5ff] shadow-[0_0_8px_#00e5ff] z-10 pointer-events-none">
                      <div className="w-2.5 h-2.5 -left-[4px] -top-1 bg-[#00e5ff] rounded-full absolute shadow-sm" />
                    </div>

                    {/* V2 Track */}
                    <div className="flex items-center gap-2">
                      <span className="w-10 font-mono text-[10px] text-sky-400 font-bold">V2</span>
                      <div className="flex-1 flex gap-2 h-7">
                        <div className="w-1/4 rounded bg-sky-500/25 border border-sky-400/40 px-2 flex items-center text-[10px] font-mono text-sky-200 truncate">
                          Titles_Motion_Overlay.mov
                        </div>
                        <div className="w-1/3 rounded bg-purple-500/25 border border-purple-400/40 px-2 flex items-center text-[10px] font-mono text-purple-200 truncate">
                          LUT_ACES_Cinematic_Pass.cube
                        </div>
                      </div>
                    </div>

                    {/* V1 Track */}
                    <div className="flex items-center gap-2">
                      <span className="w-10 font-mono text-[10px] text-sky-400 font-bold">V1</span>
                      <div className="flex-1 flex gap-1.5 h-8">
                        <div className="w-1/3 rounded bg-sky-600/30 border border-sky-500/50 px-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-100 font-medium">
                          <span>A01_Hero_Cam.mov</span>
                          <span className="text-[9px] text-sky-300/70">4K DCI</span>
                        </div>
                        <div className="w-2/5 rounded bg-sky-600/30 border border-sky-500/50 px-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-100 font-medium">
                          <span>B04_Macro_Shot.mov</span>
                          <span className="text-[9px] text-sky-300/70">120fps</span>
                        </div>
                        <div className="w-1/4 rounded bg-sky-600/30 border border-sky-500/50 px-2.5 flex items-center text-[11px] font-mono text-zinc-100 font-medium">
                          <span>C02_Drone_Reveal.mov</span>
                        </div>
                      </div>
                    </div>

                    {/* A1 Track */}
                    <div className="flex items-center gap-2">
                      <span className="w-10 font-mono text-[10px] text-emerald-400 font-bold">A1</span>
                      <div className="flex-1 h-7 rounded bg-emerald-600/20 border border-emerald-500/40 px-2.5 flex items-center justify-between text-[10px] font-mono text-emerald-200">
                        <span>Score_Original_Master_Stereo.wav</span>
                        <span className="text-[9px] text-emerald-300/70">-14 LUFS</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review note card */}
                <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#121418] flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#00e5ff]/15 border border-[#00e5ff]/30 font-mono text-[10px] font-bold text-[#00e5ff] flex items-center justify-center shrink-0 mt-0.5">
                      SL
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        Sarah L. &middot; Client
                        <span className="text-[10px] font-mono text-[#00e5ff] bg-[#00e5ff]/10 px-1.5 py-0.2 rounded border border-[#00e5ff]/20">
                          @ 01:24:12
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1">
                        "The color grade on the hero shot feels too saturated. Can we match the cooler tone from v2.1?"
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                    Resolved in v3.0
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. STATS BAND ── */}
        <section className="border-y border-white/[0.08] bg-[#0c0e12]/60 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((st) => (
              <div key={st.label} className="p-5 rounded-xl border border-white/[0.06] bg-[#121418]/60 space-y-1">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                  {st.value}
                </div>
                <div className="text-xs font-medium text-zinc-300">{st.label}</div>
                <div className="text-[11px] font-mono text-[#00e5ff]">{st.change}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. BENTO FEATURES GRID ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="features">
          <SectionHeader
            badge="Engineered for Post-Production"
            title={<>Everything a video delivery studio needs</>}
            subtitle="Built specifically for video editors, colorists, and post-production studios collaborating with clients."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {bentoFeatures.map((feat) => (
              <div
                key={feat.title}
                className={`saas-card-interactive p-6 flex flex-col justify-between ${feat.colSpan}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="saas-pill saas-pill-cyan font-mono text-[10px] uppercase">
                      {feat.tag}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-[#00e5ff]">
                      {feat.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                    {feat.description}
                  </p>
                </div>
                {feat.preview}
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. WORKFLOW STEPS ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]" id="how">
          <SectionHeader
            badge="Operating Rhythm"
            title={<>Three steps from Premiere cut to client sign-off</>}
            subtitle="A structured delivery workflow designed to eliminate endless email chains and ambiguous revisions."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((st) => (
              <div key={st.num} className="saas-card p-6 space-y-3 relative overflow-hidden">
                <div className="text-3xl font-bold font-mono text-[#00e5ff]/30">
                  {st.num}
                </div>
                <h3 className="text-base font-semibold text-white">
                  {st.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {st.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. STUDIO OUTCOMES ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
          <SectionHeader
            badge="Measurable Gains"
            title={<>Numbers production teams actually care about</>}
            subtitle="How studios cut revision cycles and accelerate final deliverables."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {outcomes.map((out) => (
              <div key={out.label} className="saas-card p-6 space-y-3">
                <span className="saas-pill font-mono text-[10px] uppercase text-zinc-400">
                  {out.tag}
                </span>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-[#00e5ff]">
                  {out.value}
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {out.label}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {out.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. REVIEWS & TESTIMONIALS ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]" id="testimonials">
          <SectionHeader
            badge="Studio Feedback"
            title={<>Trusted by leading post-production teams</>}
            subtitle="What creative directors and senior editors say about switching to CreaoLink."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="saas-card p-6 flex flex-col justify-between space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00e5ff]/15 font-mono text-xs font-bold text-[#00e5ff]">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{t.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. PRICING ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]" id="pricing">
          <SectionHeader
            badge="Transparent Pricing"
            title={<>Simple plans tailored for editing pipelines</>}
            subtitle="Start free, connect Premiere Pro, and upgrade as your client room volume expands."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((pl) => (
              <div
                key={pl.name}
                className={`saas-card p-8 flex flex-col justify-between ${
                  pl.featured
                    ? "border-[#00e5ff]/50 bg-[#12161c] shadow-[0_0_30px_rgba(0,229,255,0.15)] ring-1 ring-[#00e5ff]/30"
                    : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">{pl.name}</h3>
                    {pl.featured && (
                      <span className="saas-pill saas-pill-cyan font-mono text-[10px] uppercase">
                        Most Popular
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-3xl sm:text-4xl font-bold text-white">{pl.price}</span>
                    <span className="text-xs text-zinc-400">{pl.period}</span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {pl.description}
                  </p>

                  <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
                    {pl.points.map((pt) => (
                      <div key={pt} className="flex items-center gap-2.5 text-xs text-zinc-300">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" className="shrink-0">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href="/auth/signup"
                    className={`w-full text-center ${
                      pl.featured ? "saas-btn-cyan text-sm h-11" : "saas-btn-secondary text-sm h-11"
                    }`}
                  >
                    {pl.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. BOTTOM HIGH-IMPACT CTA ── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="relative rounded-3xl border border-white/[0.12] bg-gradient-to-b from-[#141820] to-[#0c0e12] p-10 sm:p-16 text-center overflow-hidden shadow-2xl">
            {/* Ambient spotlight */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00e5ff]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <span className="saas-pill saas-pill-cyan font-mono text-[11px] uppercase">
                Instant Onboarding
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Deliver polished cuts. Zero email chaos.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Connect your first Premiere Pro timeline in under 2 minutes. Free forever on Starter tier.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Link href="/auth/signup" className="saas-btn-cyan text-sm h-11 px-6 shadow-lg">
                  Create Free Workspace &rarr;
                </Link>
                <Link href="/auth/login" className="saas-btn-secondary text-sm h-11 px-5">
                  Sign In to Studio
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── 9. FOOTER ── */}
      <footer className="border-t border-white/[0.08] bg-[#050608] py-12 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <Link href="/" className="text-sm font-bold text-white tracking-tight">
              Creao<span className="text-[#00e5ff]">Link</span>
            </Link>
            <p className="text-zinc-500">The Premiere Pro collaborative review platform.</p>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#how" className="hover:text-white transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>All systems operational</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/[0.04] text-center text-zinc-600 font-mono text-[11px]">
          &copy; {new Date().getFullYear()} CreaoLink Technologies. Built for video editors who ship.
        </div>
      </footer>
    </div>
  );
}
