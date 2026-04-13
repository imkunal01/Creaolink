"use client";

interface Stat {
  label: string;
  value: number | string;
}

interface StatsCardsProps {
  stats: Stat[];
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-md border border-[#30363d] bg-[#161b22] px-4 py-3 hover:border-[#8b949e]/40 transition-colors duration-200"
        >
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#8b949e] sm:text-xs">
            {stat.label}
          </p>
          <p className="text-xl font-semibold tabular-nums text-[#f0f6fc] sm:text-2xl">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
