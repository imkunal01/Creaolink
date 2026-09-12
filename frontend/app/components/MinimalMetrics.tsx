"use client";

import React from "react";

const metrics = [
  { value: "< 48ms", label: "Real-time timeline mirror latency" },
  { value: "0s", label: "Local export wait time" },
  { value: "99.98%", label: "Cloud rendering reliability SLA" },
  { value: "4.8x", label: "Faster client review cycle completion" },
];

export default function MinimalMetrics() {
  return (
    <section id="metrics" className="relative z-10 py-16 sm:py-20 border-y border-white/[0.06] bg-black/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {metrics.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                {item.value}
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 font-medium">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
