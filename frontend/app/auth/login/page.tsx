"use client";

import { useState } from "react";
import Link from "next/link";
import AdminGate from "../components/AdminGate";
import AuthInput from "../components/AuthInput";

export default function LoginPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // TODO: Connect to backend API
    console.log("Login:", { email, password, isAdmin });
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <>
      {/* Card */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 sm:p-8">
        {/* Header with hidden admin gate */}
        <div className="mb-5 sm:mb-6">
          <div className="relative inline-block">
            <h2 className="text-lg font-semibold text-text-primary">
              Sign in
            </h2>
            <AdminGate onAdminUnlock={() => setIsAdmin(true)} />
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {isAdmin
              ? "Administrator access"
              : "Welcome back to CreaoLink"}
          </p>
        </div>

        {/* Admin badge */}
        {isAdmin && (
          <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-bg-tertiary border border-border rounded-lg">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs text-text-secondary">
              Admin mode active
            </span>
            <button
              onClick={() => setIsAdmin(false)}
              className="ml-auto text-xs text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            >
              Exit
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <AuthInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            error={errors.email}
          />
          <AuthInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            error={errors.password}
          />

          <div className="flex items-center justify-end mb-6">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              `Sign in${isAdmin ? " as Admin" : ""}`
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5 sm:my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-tertiary">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* OAuth options */}
        <div className="space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Continue with Google
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 1.5a10.5 10.5 0 00-3.32 20.46c.53.1.72-.23.72-.5v-1.78c-2.95.64-3.57-1.24-3.57-1.24-.48-1.22-1.18-1.54-1.18-1.54-.96-.66.07-.65.07-.65 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.47 1.14 3.08.87.09-.68.37-1.15.67-1.42-2.36-.27-4.85-1.18-4.85-5.24 0-1.16.41-2.1 1.08-2.84-.11-.27-.47-1.36.1-2.83 0 0 .88-.28 2.88 1.08a9.95 9.95 0 015.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.47.21 2.56.1 2.83.67.74 1.08 1.68 1.08 2.84 0 4.07-2.5 4.96-4.88 5.22.38.33.72.99.72 2v2.96c0 .27.19.61.73.5A10.5 10.5 0 0012 1.5z" />
            </svg>
            Continue with GitHub
          </button>
        </div>
      </div>

      {/* Footer */}
      {!isAdmin && (
        <p className="text-center text-sm text-text-tertiary mt-5 sm:mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      )}
    </>
  );
}
