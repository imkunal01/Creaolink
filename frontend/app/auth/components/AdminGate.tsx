"use client";

import { useState, useRef, useEffect } from "react";

interface AdminGateProps {
  onAdminUnlock: () => void;
}

export default function AdminGate({ onAdminUnlock }: AdminGateProps) {
  const [clickCount, setClickCount] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ADMIN_CODE = "creolink-admin-2026";
  const REQUIRED_CLICKS = 5;

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (newCount >= REQUIRED_CLICKS) {
      setShowInput(true);
      setClickCount(0);
      return;
    }

    timerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 2000);
  };

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ADMIN_CODE) {
      onAdminUnlock();
      setShowInput(false);
      setCode("");
      setError("");
    } else {
      setError("Invalid access code");
      setCode("");
    }
  };

  return (
    <>
      {/* Invisible click area overlaid on logo */}
      <div
        onClick={handleLogoClick}
        className="absolute inset-0 cursor-default z-10"
        aria-hidden="true"
      />

      {/* Admin code input modal */}
      {showInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-[#141618] border border-white/[0.1] rounded-xl p-6 w-full max-w-[340px] mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Administrator Access
              </h3>
              <button
                onClick={() => {
                  setShowInput(false);
                  setCode("");
                  setError("");
                }}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitCode}>
              <input
                ref={inputRef}
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                placeholder="Enter admin code"
                className="w-full px-3 py-2 bg-[#1c1e22] border border-white/[0.08] rounded-md text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00e5ff]/60 transition-colors"
              />
              {error && (
                <p className="text-red-400 text-[11px] mt-2 font-medium">{error}</p>
              )}
              <button
                type="submit"
                className="w-full mt-3 py-2 bg-[#00e5ff] text-[#08090a] rounded-md text-xs font-semibold hover:bg-[#38bdf8] transition-colors cursor-pointer"
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
