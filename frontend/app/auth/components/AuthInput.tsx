"use client";

import { useState } from "react";

interface AuthInputProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function AuthInput({
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-3.5">
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
        {label}
      </label>
      <div
        className={`flex items-center h-10 px-3 rounded-md bg-[#141618] border transition-colors ${
          error
            ? "border-red-500/80 ring-1 ring-red-500/30"
            : focused
            ? "border-[#00e5ff]/60 ring-1 ring-[#00e5ff]/20"
            : "border-white/[0.08] hover:border-white/[0.16]"
        }`}
      >
        <input
          type={isPassword && showPwd ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="text-[11px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer ml-2 shrink-0 select-none"
          >
            {showPwd ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[11px] font-medium text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
