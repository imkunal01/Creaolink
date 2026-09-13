import Link from "next/link";

const ADMIN_CARDS = [
  {
    title: "User Management",
    description: "Search, moderate roles, manage permissions, and review user project memberships.",
    href: "/admin/users",
    badge: "Phase 2",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Project Oversight",
    description: "System-wide project visibility, metadata editing, sync code resets, and cascade deletion.",
    href: "/admin/projects",
    badge: "Phase 3",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "Cache & Feature Flags",
    description: "Toggle DB-backed runtime flags, inspect Redis latency and circuit breaker status, bust cache keys.",
    href: "/admin/cache",
    badge: "Phase 5",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: "Feedback & Chat",
    description: "Cross-project review markers, comment moderation, and thread cleanup.",
    href: "/admin/feedback",
    badge: "Phase 6",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "System Metrics",
    description: "Real-time connection pool status, active online presence count, and Redis health telemetry.",
    href: "/admin/metrics",
    badge: "Phase 8",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: "Admin Audit Trail",
    description: "Immutable log of all administrative actions, status updates, flag toggles, and rollbacks.",
    href: "/admin/audit-log",
    badge: "Phase 9",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-[#121418] to-[#0c0d10] border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,_rgba(255,42,61,0.1)_0%,_transparent_70%)] blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff2a3d] animate-pulse" />
            <span className="text-xs font-mono font-medium text-[#ff4b5c] uppercase tracking-wider">
              Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Creaolink Admin Console
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Centralized platform oversight and management system. Control user moderation, global project state, real-time cache layers, live feature flags, and administrative audit logs.
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 font-mono uppercase tracking-wider">
            Management Modules
          </h2>
          <span className="text-xs text-zinc-500">6 Core Systems</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADMIN_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group p-5 rounded-xl bg-[#0c0d10] hover:bg-[#121418] border border-white/[0.06] hover:border-white/15 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:border-[#ff2a3d]/40 group-hover:bg-[#ff2a3d]/10 transition-colors">
                    {card.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#ff4b5c] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-normal line-clamp-2">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center text-xs font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
                <span>Access Module</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1 transform group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
