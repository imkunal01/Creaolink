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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-bg-secondary border border-border rounded-xl px-5 py-4 hover:border-border-hover transition-colors duration-200"
        >
          <p className="text-xs text-text-tertiary mb-1 uppercase tracking-wider font-medium">
            {stat.label}
          </p>
          <p className="text-2xl font-semibold text-text-primary tabular-nums">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
