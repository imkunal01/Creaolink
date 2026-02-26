"use client";

import { useState, useEffect, useCallback } from "react";

interface TickerItem {
  highlight: string;
  text: string;
}

const items: TickerItem[] = [
  { highlight: "10x faster", text: "project delivery with CreaoLink" },
  { highlight: "500+", text: "creators already building together" },
  { highlight: "Seamless", text: "collaboration between clients & freelancers" },
  { highlight: "Real-time", text: "project tracking and communication" },
  { highlight: "Trusted by", text: "teams across 30+ countries" },
];

export default function AuthTicker() {
  const [index, setIndex] = useState(0);
  const [animState, setAnimState] = useState<"enter" | "visible" | "exit">(
    "enter"
  );

  const cycle = useCallback(() => {
    setAnimState("exit");
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % items.length);
      setAnimState("enter");
      setTimeout(() => setAnimState("visible"), 50);
    }, 400);
  }, []);

  useEffect(() => {
    // Initial entrance
    const entryTimer = setTimeout(() => setAnimState("visible"), 50);
    return () => clearTimeout(entryTimer);
  }, []);

  useEffect(() => {
    const interval = setInterval(cycle, 3500);
    return () => clearInterval(interval);
  }, [cycle]);

  const item = items[index];

  const animClass =
    animState === "enter"
      ? "opacity-0 translate-y-3"
      : animState === "exit"
      ? "opacity-0 -translate-y-3"
      : "opacity-100 translate-y-0";

  return (
    <div className="flex items-center justify-center h-10 overflow-hidden">
      <p
        className={`text-sm text-text-tertiary transition-all duration-400 ease-out ${animClass}`}
      >
        <span className="font-semibold text-text-primary">{item.highlight}</span>{" "}
        {item.text}
      </p>
    </div>
  );
}
