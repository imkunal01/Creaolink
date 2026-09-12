"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setUser, type UserRole } from "@/lib/auth";
import { apiSignup } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

type PlanType = "hobby" | "pro";
type ProTier = "pro" | "business";

const PRO_PLANS: {
  id: ProTier;
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
}[] = [
  {
    id: "pro",
    name: "Growth",
    price: "₹499",
    period: "/mo",
    features: [
      "Up to 5 team members",
      "15 active project workspaces",
      "Full Premiere Pro timeline sync",
      "Priority resolution support",
      "Advanced task workflows",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "₹1,499",
    period: "/mo",
    badge: "Best Value",
    features: [
      "Unlimited team members",
      "Unlimited active projects",
      "Custom review stages & presets",
      "Dedicated account engineer",
      "Full API & webhook access",
      "Includes all Growth features",
    ],
  },
];

const STEP_LABELS = ["Plan", "Scale", "Profile", "Method", "Credentials"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [planType, setPlanType] = useState<PlanType>("hobby");
  const [proTier, setProTier] = useState<ProTier>("pro");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"client" | "freelancer">("client");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isPro = planType === "pro";
  const visualSteps = isPro ? [1, 2, 3, 4, 5] : [1, 3, 4, 5];
  const totalSteps = visualSteps.length;
  const currentVisualStep = visualSteps.indexOf(step) + 1;

  const stepTitles: Record<number, { title: string; desc: string }> = {
    1: { title: "Choose your workspace tier", desc: "Select how your studio will collaborate." },
    2: { title: "Select team scale", desc: "Unlock unlimited workspaces and team capacity." },
    3: { title: "Set up your profile", desc: "Your identity across project review rooms." },
    4: { title: "Select signup method", desc: "Choose your preferred authentication provider." },
    5: { title: "Create credentials", desc: "Set up your secure workspace access." },
  };

  const nextStep = () => {
    const idx = visualSteps.indexOf(step);
    if (idx < visualSteps.length - 1) setStep(visualSteps[idx + 1] as 1 | 2 | 3 | 4 | 5);
  };
  const prevStep = () => {
    const idx = visualSteps.indexOf(step);
    if (idx > 0) { setErrors({}); setStep(visualSteps[idx - 1] as 1 | 2 | 3 | 4 | 5); }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!username.trim()) newErrors.username = "Username is required";
    else if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.trim()))
      newErrors.username = "Use 3-24 letters, numbers, or underscore";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) nextStep();
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Must be at least 6 characters";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const { user } = await apiSignup({ name, username, email, password, role });
      setUser({
        id: user.id, name: user.name, email: user.email,
        username: user.username, role: user.role as UserRole,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setErrors({ email: err instanceof Error ? err.message : "Signup failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;
      const supabase = getSupabase();
      await supabase.auth.signOut({ scope: "local" });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, queryParams: { prompt: "select_account" } },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setErrors({ email: err instanceof Error ? err.message : "Google sign up failed" });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Step progress bar */}
      <div className="step-bar">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`step-seg${s <= currentVisualStep ? " done" : ""}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-4">
        {STEP_LABELS.slice(0, totalSteps).map((label, i) => (
          <span key={label} className={i + 1 <= currentVisualStep ? "text-[#00e5ff] font-semibold" : "text-zinc-600"}>
            {label}
          </span>
        ))}
      </div>

      <h2 className="text-xl font-bold tracking-tight text-white mb-1">
        {stepTitles[step].title}
      </h2>
      <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
        {stepTitles[step].desc}
      </p>

      {/* ── Step 1: Plan ── */}
      {step === 1 && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setPlanType("hobby")}
            className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              planType === "hobby"
                ? "bg-[#141820] border-[#00e5ff]/60 shadow-[0_0_20px_rgba(0,229,255,0.15)] ring-1 ring-[#00e5ff]/30"
                : "bg-[#0d0e12] border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Starter</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Free Forever
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Individual editors and clients. Up to 3 active project rooms.
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              planType === "hobby" ? "border-[#00e5ff]" : "border-zinc-600"
            }`}>
              {planType === "hobby" && <div className="w-2 h-2 rounded-full bg-[#00e5ff]" />}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPlanType("pro")}
            className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              planType === "pro"
                ? "bg-[#141820] border-[#00e5ff]/60 shadow-[0_0_20px_rgba(0,229,255,0.15)] ring-1 ring-[#00e5ff]/30"
                : "bg-[#0d0e12] border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Growth & Studio</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20">
                  ₹499/mo
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Active studios. Unlimited projects, full version control, priority sync.
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              planType === "pro" ? "border-[#00e5ff]" : "border-zinc-600"
            }`}>
              {planType === "pro" && <div className="w-2 h-2 rounded-full bg-[#00e5ff]" />}
            </div>
          </button>

          {/* Role selection */}
          <div className="pt-2">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
              Primary Role
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#121418] border border-white/[0.08] rounded-lg mb-5">
              {(["client", "freelancer"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    role === r
                      ? "bg-[#00e5ff] text-[#050d12] shadow-sm font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {r === "client" ? "Client / Studio" : "Freelance Editor"}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={nextStep} className="saas-btn-cyan w-full h-10 text-sm">
            Continue &rarr;
          </button>
          <p className="text-center text-xs text-zinc-500 mt-4">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-white hover:text-[#00e5ff] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      )}

      {/* ── Step 2: Pro tier picker ── */}
      {step === 2 && (
        <div className="space-y-4">
          {PRO_PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setProTier(plan.id)}
              className={`w-full p-4 rounded-xl border text-left transition-all flex flex-col cursor-pointer ${
                proTier === plan.id
                  ? "bg-[#141820] border-[#00e5ff]/60 shadow-[0_0_20px_rgba(0,229,255,0.15)] ring-1 ring-[#00e5ff]/30"
                  : "bg-[#0d0e12] border-white/[0.08] hover:border-white/20"
              }`}
            >
              <div className="flex w-full items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{plan.name}</span>
                    {plan.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {plan.price}<span className="text-xs text-zinc-500 font-normal">{plan.period}</span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                  proTier === plan.id ? "border-[#00e5ff]" : "border-zinc-600"
                }`}>
                  {proTier === plan.id && <div className="w-2 h-2 rounded-full bg-[#00e5ff]" />}
                </div>
              </div>
              <div className="mt-3 space-y-1.5 pt-3 border-t border-white/[0.06]">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
            </button>
          ))}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={prevStep} className="saas-btn-secondary flex-1 h-10">
              Back
            </button>
            <button type="button" onClick={nextStep} className="saas-btn-cyan flex-1 h-10">
              Continue &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Name & username ── */}
      {step === 3 && (
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Your Full Name</label>
            <div
              className={`flex items-center h-10 px-3 rounded-md bg-[#141618] border transition-colors ${
                errors.name
                  ? "border-red-500/80 ring-1 ring-red-500/30"
                  : "border-white/[0.08] focus-within:border-[#00e5ff]/60 focus-within:ring-1 focus-within:ring-[#00e5ff]/20 hover:border-white/[0.16]"
              }`}
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
              />
            </div>
            {errors.name && <p className="text-[11px] font-medium text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Workspace Username</label>
            <div
              className={`flex items-center h-10 px-3 rounded-md bg-[#141618] border transition-colors ${
                errors.username
                  ? "border-red-500/80 ring-1 ring-red-500/30"
                  : "border-white/[0.08] focus-within:border-[#00e5ff]/60 focus-within:ring-1 focus-within:ring-[#00e5ff]/20 hover:border-white/[0.16]"
              }`}
            >
              <span className="text-zinc-600 text-xs font-mono mr-1 select-none">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/^@+/, ""))}
                placeholder="alexmorgan"
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
              />
            </div>
            {errors.username && <p className="text-[11px] font-medium text-red-400 mt-1">{errors.username}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={prevStep} className="saas-btn-secondary flex-1 h-10">
              Back
            </button>
            <button type="submit" className="saas-btn-cyan flex-1 h-10">
              Continue &rarr;
            </button>
          </div>
        </form>
      )}

      {/* ── Step 4: Method ── */}
      {step === 4 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => { setErrors({}); nextStep(); }}
            className="oauth-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Continue with Email & Password
          </button>

          <div className="flex items-center gap-3 my-4 text-[11px] font-mono uppercase tracking-wider text-zinc-600">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span>or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
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

          <button type="button" onClick={prevStep} className="saas-btn-secondary w-full h-10 mt-3">
            Back
          </button>
        </div>
      )}

      {/* ── Step 5: Email credentials ── */}
      {step === 5 && (
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email address</label>
            <div
              className={`flex items-center h-10 px-3 rounded-md bg-[#141618] border transition-colors ${
                errors.email
                  ? "border-red-500/80 ring-1 ring-red-500/30"
                  : "border-white/[0.08] focus-within:border-[#00e5ff]/60 focus-within:ring-1 focus-within:ring-[#00e5ff]/20 hover:border-white/[0.16]"
              }`}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
              />
            </div>
            {errors.email && <p className="text-[11px] font-medium text-red-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
            <div
              className={`flex items-center h-10 px-3 rounded-md bg-[#141618] border transition-colors ${
                errors.password
                  ? "border-red-500/80 ring-1 ring-red-500/30"
                  : "border-white/[0.08] focus-within:border-[#00e5ff]/60 focus-within:ring-1 focus-within:ring-[#00e5ff]/20 hover:border-white/[0.16]"
              }`}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
              />
            </div>
            {errors.password && <p className="text-[11px] font-medium text-red-400 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm Password</label>
            <div
              className={`flex items-center h-10 px-3 rounded-md bg-[#141618] border transition-colors ${
                errors.confirmPassword
                  ? "border-red-500/80 ring-1 ring-red-500/30"
                  : "border-white/[0.08] focus-within:border-[#00e5ff]/60 focus-within:ring-1 focus-within:ring-[#00e5ff]/20 hover:border-white/[0.16]"
              }`}
            >
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] font-medium text-red-400 mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={prevStep} className="saas-btn-secondary flex-1 h-10">
              Back
            </button>
            <button type="submit" disabled={loading} className="saas-btn-cyan flex-1 h-10">
              {loading ? "Creating..." : "Complete Setup &rarr;"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
