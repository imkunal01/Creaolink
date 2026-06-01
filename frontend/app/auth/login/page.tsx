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

  const inputStyle = (hasError?: boolean) => ({
    width: "100%", height: 40, padding: "0 11px",
    background: "var(--s3)",
    border: `1px solid ${hasError ? "var(--red)" : "var(--b2)"}`,
    borderRadius: "var(--r)",
    fontSize: "0.81rem", color: "var(--white)", outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "var(--fb)",
  });

  return (
    <div>
      <div style={{ position: "relative", display: "inline-block" }}>
        <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--white)" }}>
          {isAdmin ? "Administrator access" : "Welcome back"}
        </div>
        <AdminGate onAdminUnlock={() => setIsAdmin(true)} />
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--m2)", margin: "0.2rem 0 1.35rem", lineHeight: 1.6 }}>
        Sign in to your CreaoLink workspace
      </div>

      {/* Admin badge */}
      {isAdmin && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem",
          padding: "0.5rem 0.75rem", background: "var(--s3)",
          border: "1px solid var(--b2)", borderRadius: "var(--r)",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
          <span style={{ fontSize: "0.76rem", color: "var(--m2)" }}>Admin mode active</span>
          <button
            onClick={() => setIsAdmin(false)}
            style={{
              marginLeft: "auto", fontSize: "0.72rem", color: "var(--m1)",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            Exit
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div style={{ marginBottom: "0.95rem" }}>
          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 500, color: "var(--m2)", marginBottom: "0.35rem" }}>
            Email address
          </label>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "var(--s3)", border: `1px solid ${errors.email ? "var(--red)" : "var(--b2)"}`,
            borderRadius: "var(--r)", padding: "0 11px", height: 40,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "var(--m1)", flexShrink: 0 }}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ background: "transparent", border: "none", outline: "none", fontSize: "0.81rem", color: "var(--white)", width: "100%", fontFamily: "var(--fb)" }}
            />
          </div>
          {errors.email && (
            <div style={{ fontSize: "0.72rem", color: "var(--red)", marginTop: "0.25rem" }}>{errors.email}</div>
          )}
        </div>

        {/* Password */}
        <div style={{ marginBottom: "0.5rem" }}>
          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 500, color: "var(--m2)", marginBottom: "0.35rem" }}>
            Password
          </label>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "var(--s3)", border: `1px solid ${errors.password ? "var(--red)" : "var(--b2)"}`,
            borderRadius: "var(--r)", padding: "0 11px", height: 40,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "var(--m1)", flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ background: "transparent", border: "none", outline: "none", fontSize: "0.81rem", color: "var(--white)", width: "100%", fontFamily: "var(--fb)" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{ fontSize: "0.72rem", color: "var(--m1)", cursor: "pointer", background: "none", border: "none", flexShrink: 0 }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <div style={{ fontSize: "0.72rem", color: "var(--red)", marginTop: "0.25rem" }}>{errors.password}</div>
          )}
        </div>

        {/* Forgot */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.1rem" }}>
          <Link href="/auth/forgot-password" style={{ fontSize: "0.73rem", color: "var(--m1)" }}>
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-p btn-lg btn-full"
          style={{ marginBottom: "0" }}
        >
          {loading ? "Signing in…" : `Sign in →${isAdmin ? " (Admin)" : ""}`}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", margin: "1.1rem 0", fontSize: "0.72rem", color: "var(--m1)" }}>
        <div style={{ flex: 1, height: 1, background: "var(--b2)" }} />
        or continue with
        <div style={{ flex: 1, height: 1, background: "var(--b2)" }} />
      </div>

      {/* OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="oauth-btn"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
        </svg>
        {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
      </button>

      <button type="button" className="oauth-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1.5a10.5 10.5 0 00-3.32 20.46c.53.1.72-.23.72-.5v-1.78c-2.95.64-3.57-1.24-3.57-1.24-.48-1.22-1.18-1.54-1.18-1.54-.96-.66.07-.65.07-.65 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.47 1.14 3.08.87.09-.68.37-1.15.67-1.42-2.36-.27-4.85-1.18-4.85-5.24 0-1.16.41-2.1 1.08-2.84-.11-.27-.47-1.36.1-2.83 0 0 .88-.28 2.88 1.08a9.95 9.95 0 015.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.47.21 2.56.1 2.83.67.74 1.08 1.68 1.08 2.84 0 4.07-2.5 4.96-4.88 5.22.38.33.72.99.72 2v2.96c0 .27.19.61.73.5A10.5 10.5 0 0012 1.5z" />
        </svg>
        Continue with GitHub
      </button>

      {/* Footer */}
      {!isAdmin && (
        <div style={{ fontSize: "0.77rem", color: "var(--m1)", textAlign: "center", marginTop: "1rem" }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" style={{ color: "var(--m2)", fontWeight: 500 }}>
            Create one free →
          </Link>
        </div>
      )}
    </div>
  );
}
