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

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-text-secondary mb-1.5">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full px-3 py-2.5 bg-bg-tertiary border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none transition-colors ${
          error
            ? "border-error"
            : focused
            ? "border-border-hover"
            : "border-border"
        }`}
      />
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}
