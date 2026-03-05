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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-bg-secondary border border-border rounded-xl px-4 sm:px-5 py-3 sm:py-4 hover:border-border-hover transition-colors duration-200"
        >
          <p className="text-[11px] sm:text-xs text-text-tertiary mb-1 uppercase tracking-wider font-medium">
            {stat.label}
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-text-primary tabular-nums">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
