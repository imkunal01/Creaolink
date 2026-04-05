"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthInput from "../components/AuthInput";
import { setUser, type UserRole } from "@/lib/auth";
import { apiSignup } from "@/lib/api";
import { supabase } from "@/lib/supabase";

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
    name: "Pro",
    price: "₹499",
    period: "/mo",
    features: [
      "Up to 5 team members",
      "15 active projects",
      "Full version history",
      "Priority support",
      "Advanced feedback tools",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "₹1,499",
    period: "/mo",
    badge: "Best value",
    features: [
      "Unlimited team members",
      "Unlimited projects",
      "Custom branding & themes",
      "Dedicated account manager",
      "API access & integrations",
      "Everything in Pro",
    ],
  },
];

export default function SignupPage() {
  const router = useRouter();
  // Steps: 1=plan, 2=pro pricing (conditional), 3=name, 4=method, 5=email
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [planType, setPlanType] = useState<PlanType>("hobby");
  const [proTier, setProTier] = useState<ProTier>("pro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"client" | "freelancer">("client");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isPro = planType === "pro";
  // Hobby: 1→3→4→5 (4 visual steps) · Pro: 1→2→3→4→5 (5 visual steps)
  const visualSteps = isPro ? [1, 2, 3, 4, 5] : [1, 3, 4, 5];
  const totalSteps = visualSteps.length;
  const currentVisualStep = visualSteps.indexOf(step) + 1;

  const stepTitles: Record<number, { title: string; desc: string }> = {
    1: { title: "Choose your plan", desc: "Select how you'll use CreaoLink" },
    2: { title: "Pick your Pro plan", desc: "Unlock powerful features for your team" },
    3: { title: "What should we call you?", desc: "This helps personalize your workspace" },
    4: { title: "How will you sign up?", desc: "Choose your preferred method" },
    5: { title: "Create your account", desc: "Almost there — set up your credentials" },
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
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) nextStep();
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Must be at least 6 characters";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const { user } = await apiSignup({ name, email, password, role });
      setUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setErrors({ email: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign up failed";
      setErrors({ email: message });
      setGoogleLoading(false);
    }
  };

  const providerBtnClass =
    "w-full flex items-center justify-center gap-2.5 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-200 cursor-pointer";

  return (
    <>
      <div className="bg-bg-secondary border border-border rounded-xl p-5 sm:p-8">
        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  s <= currentVisualStep ? "bg-accent" : "bg-bg-tertiary"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-text-tertiary mb-1">Step {currentVisualStep} of {totalSteps}</p>
          <h2 className="text-lg font-semibold text-text-primary">
            {stepTitles[step].title}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {stepTitles[step].desc}
          </p>
        </div>

        {/* ── Step 1: Plan type ── */}
        {step === 1 && (
          <div>
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => setPlanType("hobby")}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                  planType === "hobby"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-text-primary block">
                      Hobby
                    </span>
                    <span className="text-xs text-text-tertiary mt-0.5 block">
                      For personal & side projects
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      planType === "hobby"
                        ? "border-accent"
                        : "border-border"
                    }`}
                  >
                    {planType === "hobby" && (
                      <div className="w-2 h-2 rounded-full bg-accent" />
                    )}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPlanType("pro")}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                  planType === "pro"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-text-primary block">
                      Pro
                    </span>
                    <span className="text-xs text-text-tertiary mt-0.5 block">
                      For commercial & team projects
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      planType === "pro"
                        ? "border-accent"
                        : "border-border"
                    }`}
                  >
                    {planType === "pro" && (
                      <div className="w-2 h-2 rounded-full bg-accent" />
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Role selector inline */}
            <div className="mb-6">
              <p className="text-xs text-text-tertiary mb-2">I am a</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border ${
                    role === "client"
                      ? "bg-accent text-bg border-accent"
                      : "bg-transparent text-text-secondary border-border hover:border-border-hover hover:text-text-primary"
                  }`}
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => setRole("freelancer")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border ${
                    role === "freelancer"
                      ? "bg-accent text-bg border-accent"
                      : "bg-transparent text-text-secondary border-border hover:border-border-hover hover:text-text-primary"
                  }`}
                >
                  Freelancer
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => nextStep()}
              className="w-full py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-all duration-200 cursor-pointer"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 2: Pro plan selection (only when Pro) ── */}
        {step === 2 && (
          <div>
            <div className="space-y-3 mb-6">
              {PRO_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setProTier(plan.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 cursor-pointer relative ${
                    proTier === plan.id
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-border-hover"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-3 bg-accent text-bg text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-sm font-semibold text-text-primary block">
                        {plan.name}
                      </span>
                      <span className="text-lg font-bold text-text-primary mt-0.5 block">
                        {plan.price}
                        <span className="text-xs font-normal text-text-tertiary">
                          {plan.period}
                        </span>
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors mt-1 ${
                        proTier === plan.id ? "border-accent" : "border-border"
                      }`}
                    >
                      {proTier === plan.id && (
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                        <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <p className="text-xs text-text-tertiary text-center mb-4">
              Payment via Razorpay will be set up after signup.
              <br />
              You can change or cancel your plan anytime.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => prevStep()}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-200 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => nextStep()}
                className="flex-1 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-all duration-200 cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Name ── */}
        {step === 3 && (
          <form onSubmit={handleNameSubmit}>
            <AuthInput
              label="Your name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={setName}
              error={errors.name}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => prevStep()}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-200 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-all duration-200 cursor-pointer"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* ── Step 4: Choose method ── */}
        {step === 4 && (
          <div>
            <div className="space-y-3 mb-4">
              {/* Continue with Email */}
              <button
                type="button"
                onClick={() => { setErrors({}); nextStep(); }}
                className={providerBtnClass}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Continue with Email
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-tertiary">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className={providerBtnClass}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
              </button>

              {/* GitHub */}
              <button type="button" className={providerBtnClass}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1.5a10.5 10.5 0 00-3.32 20.46c.53.1.72-.23.72-.5v-1.78c-2.95.64-3.57-1.24-3.57-1.24-.48-1.22-1.18-1.54-1.18-1.54-.96-.66.07-.65.07-.65 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.47 1.14 3.08.87.09-.68.37-1.15.67-1.42-2.36-.27-4.85-1.18-4.85-5.24 0-1.16.41-2.1 1.08-2.84-.11-.27-.47-1.36.1-2.83 0 0 .88-.28 2.88 1.08a9.95 9.95 0 015.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.47.21 2.56.1 2.83.67.74 1.08 1.68 1.08 2.84 0 4.07-2.5 4.96-4.88 5.22.38.33.72.99.72 2v2.96c0 .27.19.61.73.5A10.5 10.5 0 0012 1.5z" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            <button
              type="button"
              onClick={() => prevStep()}
              className="w-full py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-200 cursor-pointer mt-2"
            >
              Back
            </button>

            <p className="text-xs text-text-tertiary text-center mt-4 leading-relaxed">
              By signing up, you agree to our{" "}
              <Link href="#" className="text-text-secondary hover:text-text-primary transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-text-secondary hover:text-text-primary transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        )}

        {/* ── Step 5: Email credentials ── */}
        {step === 5 && (
          <form onSubmit={handleEmailSignup}>
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

            <AuthInput
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => prevStep()}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-200 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-text-tertiary mt-5 sm:mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
