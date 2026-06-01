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
    <div style={{ marginBottom: "0.9rem" }}>
      <label style={{
        display: "block",
        fontSize: "0.74rem",
        fontWeight: 500,
        color: "var(--m2)",
        marginBottom: "0.35rem",
      }}>
        {label}
      </label>
      <div style={{
        display: "flex",
        alignItems: "center",
        background: "var(--s3)",
        border: `1px solid ${error ? "var(--red)" : focused ? "var(--b3)" : "var(--b2)"}`,
        borderRadius: "var(--r)",
        padding: "0 11px",
        height: 40,
        gap: 7,
        transition: "border-color 0.15s",
      }}>
        <input
          type={isPassword && showPwd ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "0.81rem",
            color: "var(--white)",
            width: "100%",
            fontFamily: "var(--fb)",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            style={{
              fontSize: "0.7rem",
              color: "var(--m1)",
              cursor: "pointer",
              background: "none",
              border: "none",
              flexShrink: 0,
              fontFamily: "var(--fb)",
            }}
          >
            {showPwd ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && (
        <div style={{ fontSize: "0.72rem", color: "var(--red)", marginTop: "0.25rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
