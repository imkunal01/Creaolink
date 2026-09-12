"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthModal, type AuthTab } from "./AuthModalContext";
import AdminGate from "../auth/components/AdminGate";
import { setUser, type UserRole } from "@/lib/auth";
import { apiLogin, apiSignup } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

type PlanType = "hobby" | "pro";

export default function AuthModal() {
  const router = useRouter();
  const { isOpen, tab, setTab, closeAuthModal } = useAuthModal();

  // Sign In State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sign Up State
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [planType, setPlanType] = useState<PlanType>("hobby");
  const [role, setRole] = useState<"client" | "freelancer">("client");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [signupLoading, setSignupLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeAuthModal]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Validate Sign In
  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    if (!loginEmail.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail))
      newErrors.email = "Invalid email format";
    if (!loginPassword) newErrors.password = "Password is required";
    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoginLoading(true);
    try {
      const { user } = await apiLogin(loginEmail, loginPassword);
      setUser({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role as UserRole,
      });
      closeAuthModal();
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setLoginErrors({ email: message });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleAuth = async (targetRole: "client" | "freelancer" = "client") => {
    try {
      setGoogleLoading(true);
      const redirectTo = `${window.location.origin}/auth/callback?role=${targetRole}`;
      const supabase = getSupabase();
      await supabase.auth.signOut({ scope: "local" });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, queryParams: { prompt: "select_account" } },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google authentication failed";
      setLoginErrors({ email: message });
      setGoogleLoading(false);
    }
  };

  // Sign Up Flow Step Handlers
  const handleStep1Next = () => {
    setSignupStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!username.trim()) newErrors.username = "Username is required";
    else if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.trim()))
      newErrors.username = "Use 3-24 letters, numbers, or underscore";
    setSignupErrors(newErrors);
    if (Object.keys(newErrors).length === 0) setSignupStep(3);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!signupEmail.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail))
      newErrors.email = "Invalid email format";
    if (!signupPassword) newErrors.password = "Password is required";
    else if (signupPassword.length < 6)
      newErrors.password = "Must be at least 6 characters";
    if (signupPassword !== signupConfirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setSignupErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSignupLoading(true);
    try {
      const { user } = await apiSignup({
        name,
        username,
        email: signupEmail,
        password: signupPassword,
        role,
      });
      setUser({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role as UserRole,
      });
      closeAuthModal();
      router.push("/dashboard");
    } catch (err: unknown) {
      setSignupErrors({
        email: err instanceof Error ? err.message : "Signup failed",
      });
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          Low-Intensity Subtle Blur Backdrop Overlay
          ───────────────────────────────────────────────────────────── */}
      <div
        onClick={closeAuthModal}
        className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* ─────────────────────────────────────────────────────────────
          Translucent Glass Container with Low Opacity
          ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-[460px] bg-[#0c0e14]/55 border border-white/[0.16] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md p-6 sm:p-8 z-10 text-white overflow-hidden my-auto">
        {/* Subtle Ambient Flare Inside Modal */}
        <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-[radial-gradient(circle,_rgba(255,248,225,0.12)_0%,_transparent_70%)] blur-2xl pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-[radial-gradient(circle,_rgba(0,229,255,0.08)_0%,_transparent_70%)] blur-2xl pointer-events-none" />

        {/* Modal Top Header with Logo & Close Button */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10">
              <Image
                src="/favicon.ico"
                alt="Creaolink Logo"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <span className="font-bold text-sm tracking-tight text-white/95">
              Creaolink
            </span>
          </div>

          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Segmented Pill Tabs: Sign In / Create Account */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 border border-white/[0.1] rounded-full mb-6 relative z-10">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`py-2 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              tab === "login"
                ? "bg-white text-black shadow-md scale-[1.01]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setSignupStep(1);
            }}
            className={`py-2 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              tab === "signup"
                ? "bg-white text-black shadow-md scale-[1.01]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SIGN IN VIEW
            ═══════════════════════════════════════════════════════════ */}
        {tab === "login" && (
          <div className="relative z-10 animate-in fade-in duration-200">
            <div className="relative inline-block mb-1">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {isAdmin ? "Administrator Access" : "Welcome back"}
              </h2>
              <AdminGate onAdminUnlock={() => setIsAdmin(true)} />
            </div>
            <p className="text-xs text-neutral-400 mb-6">
              Sign in to your Creaolink workspace to continue.
            </p>

            {/* Admin mode alert */}
            {isAdmin && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-emerald-300">
                  Admin mode active
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdmin(false)}
                  className="ml-auto text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Exit
                </button>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Email address
                </label>
                <div
                  className={`flex items-center h-11 px-3.5 rounded-xl bg-white/[0.03] border transition-all ${
                    loginErrors.email
                      ? "border-red-500/80 ring-1 ring-red-500/30"
                      : "border-white/[0.1] focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 hover:border-white/[0.18]"
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="text-neutral-400 shrink-0 mr-2.5"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className="w-full bg-transparent text-xs text-white placeholder:text-neutral-600 outline-none"
                  />
                </div>
                {loginErrors.email && (
                  <p className="text-[11px] font-medium text-red-400 mt-1">
                    {loginErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert("Please contact your workspace admin for password recovery.")}
                    className="text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div
                  className={`flex items-center h-11 px-3.5 rounded-xl bg-white/[0.03] border transition-all ${
                    loginErrors.password
                      ? "border-red-500/80 ring-1 ring-red-500/30"
                      : "border-white/[0.1] focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 hover:border-white/[0.18]"
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="text-neutral-400 shrink-0 mr-2.5"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-xs text-white placeholder:text-neutral-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2 select-none"
                  >
                    {showLoginPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-[11px] font-medium text-red-400 mt-1">
                    {loginErrors.password}
                  </p>
                )}
              </div>

              {/* Submit Button (White Pill) */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full h-11 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(255,255,255,0.18)] cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                ) : (
                  <span>{isAdmin ? "Sign in as Administrator" : "Sign In & Continue"}</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span>or</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleGoogleAuth("client")}
                disabled={googleLoading}
                className="w-full h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                {googleLoading ? "Connecting..." : "Continue with Google"}
              </button>

              <button
                type="button"
                onClick={() => handleGoogleAuth("client")}
                className="w-full h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1.5a10.5 10.5 0 00-3.32 20.46c.53.1.72-.23.72-.5v-1.78c-2.95.64-3.57-1.24-3.57-1.24-.48-1.22-1.18-1.54-1.18-1.54-.96-.66.07-.65.07-.65 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.47 1.14 3.08.87.09-.68.37-1.15.67-1.42-2.36-.27-4.85-1.18-4.85-5.24 0-1.16.41-2.1 1.08-2.84-.11-.27-.47-1.36.1-2.83 0 0 .88-.28 2.88 1.08a9.95 9.95 0 015.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.47.21 2.56.1 2.83.67.74 1.08 1.68 1.08 2.84 0 4.07-2.5 4.96-4.88 5.22.38.33.72.99.72 2v2.96c0 .27.19.61.73.5A10.5 10.5 0 0012 1.5z" />
                </svg>
                Continue with GitHub
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CREATE ACCOUNT VIEW
            ═══════════════════════════════════════════════════════════ */}
        {tab === "signup" && (
          <div className="relative z-10 animate-in fade-in duration-200">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5 mb-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    s <= signupStep ? "bg-white" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Tier & Role */}
            {signupStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white mb-1">
                    Select Your Plan
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Choose how you and your team will collaborate.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setPlanType("hobby")}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      planType === "hobby"
                        ? "bg-white/10 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                        : "bg-white/[0.02] border-white/[0.08] hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Starter</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Free
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Solo editors and review rooms.
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        planType === "hobby" ? "border-white" : "border-neutral-600"
                      }`}
                    >
                      {planType === "hobby" && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanType("pro")}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      planType === "pro"
                        ? "bg-white/10 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                        : "bg-white/[0.02] border-white/[0.08] hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Studio &amp; Growth</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/10 text-white border border-white/20">
                          ₹499/mo
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Unlimited workspaces, timeline sync &amp; priority.
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        planType === "pro" ? "border-white" : "border-neutral-600"
                      }`}
                    >
                      {planType === "pro" && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Primary Role Selector */}
                <div className="pt-1">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    Primary Role
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                    {(["client", "freelancer"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          role === r
                            ? "bg-white text-black shadow-sm font-bold"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        {r === "client" ? "Client / Studio" : "Freelance Editor"}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="w-full h-11 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(255,255,255,0.18)] cursor-pointer mt-3"
                >
                  Continue &rarr;
                </button>
              </div>
            )}

            {/* Step 2: Profile Setup */}
            {signupStep === 2 && (
              <form onSubmit={handleStep2Next} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white mb-1">
                    Your Profile
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Your identity across project review rooms.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Full Name
                  </label>
                  <div
                    className={`flex items-center h-11 px-3.5 rounded-xl bg-white/[0.03] border transition-all ${
                      signupErrors.name
                        ? "border-red-500/80 ring-1 ring-red-500/30"
                        : "border-white/[0.1] focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 hover:border-white/[0.18]"
                    }`}
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full bg-transparent text-xs text-white placeholder:text-neutral-600 outline-none"
                    />
                  </div>
                  {signupErrors.name && (
                    <p className="text-[11px] font-medium text-red-400 mt-1">
                      {signupErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Workspace Username
                  </label>
                  <div
                    className={`flex items-center h-11 px-3.5 rounded-xl bg-white/[0.03] border transition-all ${
                      signupErrors.username
                        ? "border-red-500/80 ring-1 ring-red-500/30"
                        : "border-white/[0.1] focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 hover:border-white/[0.18]"
                    }`}
                  >
                    <span className="text-neutral-500 text-xs font-mono mr-1 select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/^@+/, ""))}
                      placeholder="alexmorgan"
                      className="w-full bg-transparent text-xs text-white placeholder:text-neutral-600 outline-none"
                    />
                  </div>
                  {signupErrors.username && (
                    <p className="text-[11px] font-medium text-red-400 mt-1">
                      {signupErrors.username}
                    </p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="flex-1 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(255,255,255,0.18)] cursor-pointer"
                  >
                    Continue &rarr;
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Authentication Credentials */}
            {signupStep === 3 && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white mb-1">
                    Security &amp; Password
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Create credentials to secure your workspace.
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Email address
                  </label>
                  <div
                    className={`flex items-center h-11 px-3.5 rounded-xl bg-white/[0.03] border transition-all ${
                      signupErrors.email
                        ? "border-red-500/80 ring-1 ring-red-500/30"
                        : "border-white/[0.1] focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 hover:border-white/[0.18]"
                    }`}
                  >
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@studio.com"
                      className="w-full bg-transparent text-xs text-white placeholder:text-neutral-600 outline-none"
                    />
                  </div>
                  {signupErrors.email && (
                    <p className="text-[11px] font-medium text-red-400 mt-1">
                      {signupErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Password
                  </label>
                  <div
                    className={`flex items-center h-11 px-3.5 rounded-xl bg-white/[0.03] border transition-all ${
                      signupErrors.password
                        ? "border-red-500/80 ring-1 ring-red-500/30"
                        : "border-white/[0.1] focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 hover:border-white/[0.18]"
                    }`}
                  >
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-xs text-white placeholder:text-neutral-600 outline-none"
                    />
                  </div>
                  {signupErrors.password && (
                    <p className="text-[11px] font-medium text-red-400 mt-1">
                      {signupErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div
                    className={`flex items-center h-11 px-3.5 rounded-xl bg-white/[0.03] border transition-all ${
                      signupErrors.confirmPassword
                        ? "border-red-500/80 ring-1 ring-red-500/30"
                        : "border-white/[0.1] focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 hover:border-white/[0.18]"
                    }`}
                  >
                    <input
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-xs text-white placeholder:text-neutral-600 outline-none"
                    />
                  </div>
                  {signupErrors.confirmPassword && (
                    <p className="text-[11px] font-medium text-red-400 mt-1">
                      {signupErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSignupStep(2)}
                    className="flex-1 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="flex-1 h-11 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(255,255,255,0.18)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {signupLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    ) : (
                      <span>Complete Setup &rarr;</span>
                    )}
                  </button>
                </div>

                {/* Google alternative */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleGoogleAuth(role)}
                    disabled={googleLoading}
                    className="w-full h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                    </svg>
                    Or fast signup with Google
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
