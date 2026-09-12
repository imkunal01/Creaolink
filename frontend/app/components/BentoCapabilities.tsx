"use client";

export default function BentoCapabilities() {
  const capabilities = [
    {
      badge: "Signature Bridge",
      title: "Premiere Pro UXP Real-Time Sync",
      desc: "Connect Adobe Premiere Pro directly to your client review room with a 6-digit sync code. Track markers, sequence cuts, audio stems, and timecodes stream in real time without rendering a single file.",
      colSpan: "lg:col-span-2",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ),
      visual: (
        <div className="mt-4 p-3.5 rounded-xl bg-black/50 border border-white/[0.08] font-mono text-xs space-y-2">
          <div className="flex justify-between items-center text-[11px] text-zinc-400 border-b border-white/[0.06] pb-2">
            <span>SYNC PROTOCOL: UXP_SOCKET_2026</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected (0ms lag)
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-300">Active Sequence:</span>
              <span className="text-white font-medium">Reel_Nike_Commercial.prproj</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-300">Timeline Length:</span>
              <span className="text-rose-400">00:03:14:12 (4,668 frames)</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: "Precision",
      title: "Frame-Accurate Timecodes",
      desc: "Clients click directly on the timeline or video canvas to leave feedback locked to exact timestamps (00:01:24:18). Never transcribe timecodes again.",
      colSpan: "lg:col-span-1",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      visual: (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center font-mono">
          <div className="text-2xl font-bold text-amber-300 tracking-wider">00:01:42:06</div>
          <div className="text-[10px] text-amber-400/80 mt-1">Locked Frame Marker</div>
        </div>
      ),
    },
    {
      badge: "Versioning",
      title: "Side-by-Side Version Diffs",
      desc: "Switch seamlessly between v1, v2, and locked cut. Inspect exactly which cut was tightened and which color grade was adjusted.",
      colSpan: "lg:col-span-1",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
      ),
      visual: (
        <div className="mt-4 grid grid-cols-2 gap-2 text-center font-mono text-[11px]">
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08]">
            <span className="text-zinc-400 block text-[10px]">Version</span>
            <span className="text-white font-bold">v1.0 Rough</span>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30">
            <span className="text-rose-400 block text-[10px]">Current</span>
            <span className="text-white font-bold">v2.1 Approved</span>
          </div>
        </div>
      ),
    },
    {
      badge: "No Software Needed",
      title: "Dedicated Client Review Room",
      desc: "Clients open a secure web link on any browser or iPad. No Adobe Creative Cloud license, no software download, and zero technical friction.",
      colSpan: "lg:col-span-2",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      visual: (
        <div className="mt-4 p-3 rounded-xl bg-black/50 border border-white/[0.08] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-300">Client Approval Status</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
            100% Ready to Deliver
          </span>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-mono uppercase tracking-wider">
            Enterprise Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Engineered for High-Velocity Post-Production
          </h2>
          <p className="text-base text-zinc-400 leading-relaxed">
            Eliminate the rendering bottleneck entirely. Creaolink turns days of back-and-forth exports into seamless, instant collaboration.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {capabilities.map((item, idx) => (
            <div
              key={idx}
              className={`glass-panel-3d rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-rose-500/30 transition-all duration-300 ${item.colSpan}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <div>{item.visual}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
