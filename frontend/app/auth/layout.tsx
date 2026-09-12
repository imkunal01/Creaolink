import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07080a] text-white flex">
      {/* Left brand showcase panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden border-r border-white/[0.08] bg-[#0c0e12]/80 bg-mesh">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00e5ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 group inline-flex mb-12">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00e5ff] to-[#0077b6] text-[#050d12] shadow-[0_0_20px_rgba(0,229,255,0.4)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Creao<span className="text-[#00e5ff]">Link</span>
            </span>
          </Link>

          <span className="saas-pill saas-pill-cyan font-mono text-[10px] uppercase mb-4 inline-block">
            Post-Production Operating System
          </span>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight mb-4 max-w-md">
            Creative delivery without{" "}
            <span className="bg-gradient-to-r from-[#00e5ff] to-sky-300 bg-clip-text text-transparent">
              workflow chaos
            </span>
            .
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed max-w-md mb-8">
            The high-precision review workspace for video editors and client studios. Real-time Premiere Pro timeline sync, frame-accurate feedback, and version-safe approvals.
          </p>

          {/* Feature list */}
          <div className="space-y-3 max-w-md">
            {[
              "Role-based review rooms for clients & editors",
              "Frame-accurate timecode markers & version stack",
              "Actionable feedback automatically assigned to tasks",
              "Native Adobe Premiere Pro UXP extension sync",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-xs text-zinc-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial card */}
        <div className="relative z-10 saas-card p-5 mt-12 max-w-md bg-[#121418]/80">
          <p className="text-xs text-zinc-300 leading-relaxed italic mb-4">
            &ldquo;Version tracking and Premiere timeline sync saved us from repetitive client revisions. We onboarded our entire studio in less than an hour.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00e5ff]/20 font-mono text-xs font-bold text-[#00e5ff] border border-[#00e5ff]/30">
              KD
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Kunal Dhangar</div>
              <div className="text-[10px] text-zinc-500 font-mono">Lead Editor & Colorist</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile top logo */}
          <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-[#00e5ff] to-[#0077b6] text-[#050d12]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white">
                Creao<span className="text-[#00e5ff]">Link</span>
              </span>
            </Link>
            <Link href="/" className="text-xs text-zinc-400 hover:text-white font-mono">
              &larr; Back
            </Link>
          </div>

          <div className="saas-card p-6 sm:p-8 bg-[#0c0e12]/90">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
