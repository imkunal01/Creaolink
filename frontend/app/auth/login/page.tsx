"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminGate from "../components/AdminGate";
import { setUser, type UserRole } from "@/lib/auth";
import { apiLogin } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { user } = await apiLogin(email, password);
      setUser({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role as UserRole,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setErrors({ email: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const redirectTo = `${window.location.origin}/auth/callback?role=client`;
      const supabase = getSupabase();
      await supabase.auth.signOut({ scope: "local" });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, queryParams: { prompt: "select_account" } },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign in failed";
      setErrors({ email: message });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative inline-block mb-1">
        <h2 className="text-xl font-bold tracking-tight text-white">
          {isAdmin ? "Administrator Access" : "Welcome back"}
        </h2>
        <AdminGate onAdminUnlock={() => setIsAdmin(true)} />
      </div>
      <p className="text-xs text-zinc-400 mb-6">
        Sign in to your CreaoLink workspace to continue.
      </p>

      {/* Admin badge */}
      {isAdmin && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-300">Admin mode active</span>
          <button
            type="button"
            onClick={() => setIsAdmin(false)}
            className="ml-auto text-[11px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Exit
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Email address
          </label>
          <div
            className={`flex items-center h-10 px-3 rounded-md bg-[#141618] border transition-colors ${
              errors.email
                ? "border-red-500/80 ring-1 ring-red-500/30"
                : "border-white/[0.08] focus-within:border-[#00e5ff]/60 focus-within:ring-1 focus-within:ring-[#00e5ff]/20 hover:border-white/[0.16]"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-zinc-500 shrink-0 mr-2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
            />
          </div>
          {errors.email && (
            <p className="text-[11px] font-medium text-red-400 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div
            className={`flex items-center h-10 px-3 rounded-md bg-[#141618] border transition-colors ${
              errors.password
                ? "border-red-500/80 ring-1 ring-red-500/30"
                : "border-white/[0.08] focus-within:border-[#00e5ff]/60 focus-within:ring-1 focus-within:ring-[#00e5ff]/20 hover:border-white/[0.16]"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-zinc-500 shrink-0 mr-2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-[11px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2 select-none"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-medium text-red-400 mt-1">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-p btn-lg btn-full mt-2"
        >
          {loading ? "Authenticating..." : `Sign in${isAdmin ? " as Administrator" : ""}`}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5 text-[11px] font-mono uppercase tracking-wider text-zinc-600">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span>or</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      {/* OAuth */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="oauth-btn"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
          </svg>
          {googleLoading ? "Connecting to Google..." : "Continue with Google"}
        </button>

        <button type="button" className="oauth-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1.5a10.5 10.5 0 00-3.32 20.46c.53.1.72-.23.72-.5v-1.78c-2.95.64-3.57-1.24-3.57-1.24-.48-1.22-1.18-1.54-1.18-1.54-.96-.66.07-.65.07-.65 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.47 1.14 3.08.87.09-.68.37-1.15.67-1.42-2.36-.27-4.85-1.18-4.85-5.24 0-1.16.41-2.1 1.08-2.84-.11-.27-.47-1.36.1-2.83 0 0 .88-.28 2.88 1.08a9.95 9.95 0 015.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.47.21 2.56.1 2.83.67.74 1.08 1.68 1.08 2.84 0 4.07-2.5 4.96-4.88 5.22.38.33.72.99.72 2v2.96c0 .27.19.61.73.5A10.5 10.5 0 0012 1.5z" />
          </svg>
          Continue with GitHub
        </button>
      </div>

      {/* Footer */}
      {!isAdmin && (
        <p className="text-xs text-zinc-500 text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-white hover:text-[#00e5ff] font-medium transition-colors">
            Create one free
          </Link>
        </p>
      )}
    </div>
  );
}
