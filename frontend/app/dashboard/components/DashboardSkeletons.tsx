"use client";

export function SkeletonBox({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-white/[0.05] ${className}`}
    />
  );
}

export function DashboardHomeSkeleton() {
  return (
    <div className="mc pb-10 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-2">
          <SkeletonBox className="h-7 w-56" />
          <SkeletonBox className="h-3.5 w-72" />
        </div>
        <SkeletonBox className="h-9 w-36 rounded-md" />
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="kpi-card space-y-2.5">
            <SkeletonBox className="h-8 w-16" />
            <SkeletonBox className="h-3.5 w-28" />
            <SkeletonBox className="h-3 w-20 mt-2" />
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Table Skeleton */}
          <div className="cl-card overflow-hidden">
            <div className="cl-card-head bg-[#0d0e10] flex justify-between items-center">
              <SkeletonBox className="h-4 w-36" />
              <SkeletonBox className="h-3 w-16" />
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.03] last:border-0">
                  <div className="space-y-1.5 flex-1">
                    <SkeletonBox className="h-4 w-44" />
                    <SkeletonBox className="h-3 w-32" />
                  </div>
                  <SkeletonBox className="h-5 w-16 rounded-full" />
                  <SkeletonBox className="h-3.5 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Activity Stream Skeleton */}
          <div className="cl-card overflow-hidden">
            <div className="cl-card-head bg-[#0d0e10]">
              <SkeletonBox className="h-4 w-32" />
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBox className="h-7 w-7 rounded-md shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <SkeletonBox className="h-3.5 w-full max-w-sm" />
                    <SkeletonBox className="h-2.5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="cl-card p-4 space-y-3">
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className="h-10 w-full rounded-md" />
            <SkeletonBox className="h-10 w-full rounded-md" />
            <SkeletonBox className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectsListSkeleton() {
  return (
    <div className="mc pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-2">
          <SkeletonBox className="h-7 w-40" />
          <SkeletonBox className="h-3.5 w-60" />
        </div>
        <SkeletonBox className="h-9 w-32 rounded-md" />
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
        <SkeletonBox className="h-9 w-56 rounded-md" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="cl-card p-4 space-y-4">
            <div className="flex justify-between items-start">
              <SkeletonBox className="h-5 w-3/4" />
              <SkeletonBox className="h-5 w-14 rounded-full" />
            </div>
            <SkeletonBox className="h-3 w-full" />
            <SkeletonBox className="h-3 w-2/3" />
            <div className="pt-3 border-t border-white/[0.06] flex justify-between items-center">
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="mc pb-12 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-2">
          <SkeletonBox className="h-3 w-32" />
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-7 w-64" />
            <SkeletonBox className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 w-24 rounded-md" />
          <SkeletonBox className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-4 border-b border-white/[0.06] pb-2">
        <SkeletonBox className="h-7 w-20 rounded" />
        <SkeletonBox className="h-7 w-20 rounded" />
        <SkeletonBox className="h-7 w-24 rounded" />
      </div>

      {/* Main timeline / preview block */}
      <div className="cl-card p-6 space-y-4">
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-5 w-48" />
          <SkeletonBox className="h-7 w-32 rounded-md" />
        </div>
        <SkeletonBox className="h-64 md:h-96 w-full rounded-lg" />
      </div>

      {/* Activity or feedback stream */}
      <div className="cl-card p-4 space-y-3">
        <SkeletonBox className="h-4 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 py-2 border-b border-white/[0.04]">
            <SkeletonBox className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <SkeletonBox className="h-3.5 w-1/3" />
              <SkeletonBox className="h-3 w-full max-w-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div className="app-shell">
      {/* Topbar Skeleton */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-7 w-28" />
          </div>
          <div className="flex items-center gap-4">
            <SkeletonBox className="h-8 w-44 rounded-md hidden sm:block" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar Skeleton */}
        <aside className="sidebar">
          <div className="p-4 space-y-4">
            <SkeletonBox className="h-4 w-20" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonBox key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="app-main">
          <DashboardHomeSkeleton />
        </main>
      </div>
    </div>
  );
}
