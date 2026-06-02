"use client";

interface Stat {
  label: string;
  value: number | string;
  accent?: boolean;
  trend?: string;
}

interface StatsCardsProps {
  stats: Stat[];
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="kpi-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="kpi-card">
          <div className={`kpi-num${stat.accent ? " accent" : ""}`}>
            {stat.value}
          </div>
          <div className="kpi-label">{stat.label}</div>
          {stat.trend && (
            <div className="kpi-trend up">{stat.trend}</div>
          )}
        </div>
      ))}
    </div>
  );
}
