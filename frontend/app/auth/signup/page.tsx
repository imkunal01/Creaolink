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
      "Everything in Growth",
    ],
  },
];

const STEP_LABELS = ["Plan", "Role", "Profile", "Method", "Done"];

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
    1: { title: "Choose your plan", desc: "Select how you'll use CreaoLink" },
    2: { title: "Pick your plan", desc: "Unlock powerful features for your team" },
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

  const inputStyle = (hasError?: boolean) => ({
    width: "100%", height: 40, padding: "0 11px",
    background: "var(--s3)",
    border: `1px solid ${hasError ? "var(--red)" : "var(--b2)"}`,
    borderRadius: "var(--r)", fontSize: "0.81rem", color: "var(--white)",
    outline: "none", fontFamily: "var(--fb)", transition: "border-color 0.15s",
  } as React.CSSProperties);

  return (
    <div>
      {/* Step progress bar */}
      <div className="step-bar">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`step-seg${s <= currentVisualStep ? " done" : ""}`}
          />
        ))}
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: "0.62rem", color: "var(--m1)", marginBottom: "1.1rem",
      }}>
        {STEP_LABELS.slice(0, totalSteps).map((label, i) => (
          <span key={label} style={{ color: i + 1 <= currentVisualStep ? "var(--red)" : "var(--m1)" }}>
            {label}
          </span>
        ))}
      </div>

      <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--white)" }}>
        {stepTitles[step].title}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--m2)", margin: "0.2rem 0 1.1rem", lineHeight: 1.6 }}>
        {stepTitles[step].desc}
      </div>

      {/* ── Step 1: Plan ── */}
      {step === 1 && (
        <div>
          {/* Plan options */}
          <button
            type="button"
            onClick={() => setPlanType("hobby")}
            className={`plan-opt${planType === "hobby" ? " sel" : ""}`}
            style={{ width: "100%" }}
          >
            <div>
              <div style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--white)" }}>
                Starter{" "}
                <span style={{
                  background: "rgba(74,222,128,.12)", color: "#4ade80",
                  border: "1px solid rgba(74,222,128,.2)", borderRadius: 3,
                  fontSize: "0.6rem", fontWeight: 600, padding: "1px 7px", marginLeft: "0.3rem",
                }}>Free forever</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--m1)", marginTop: "0.12rem" }}>
                Personal projects · up to 3 workspaces
              </div>
            </div>
            <div style={{
              width: 15, height: 15, borderRadius: "50%",
              border: `1.5px solid ${planType === "hobby" ? "var(--red)" : "var(--b3)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {planType === "hobby" && (
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)" }} />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPlanType("pro")}
            className={`plan-opt${planType === "pro" ? " sel" : ""}`}
            style={{ width: "100%" }}
          >
            <div>
              <div style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--white)" }}>
                Growth{" "}
                <span style={{
                  background: "var(--rs)", color: "var(--red)",
                  border: "1px solid var(--rg)", borderRadius: 3,
                  fontSize: "0.6rem", fontWeight: 600, padding: "1px 7px", marginLeft: "0.3rem",
                }}>₹499/mo</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--m1)", marginTop: "0.12rem" }}>
                Unlimited projects · version history · priority support
              </div>
            </div>
            <div style={{
              width: 15, height: 15, borderRadius: "50%",
              border: `1.5px solid ${planType === "pro" ? "var(--red)" : "var(--b3)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {planType === "pro" && (
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)" }} />
              )}
            </div>
          </button>

          {/* Role */}
          <div style={{ fontSize: "0.73rem", color: "var(--m1)", margin: "0.85rem 0 0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            I am a
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.1rem" }}>
            {(["client", "freelancer"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  padding: "0.6rem", border: `1px solid ${role === r ? "var(--red)" : "var(--b2)"}`,
                  borderRadius: "var(--r)", textAlign: "center", fontSize: "0.81rem", fontWeight: 500,
                  cursor: "pointer", background: role === r ? "var(--red)" : "var(--s3)",
                  color: role === r ? "#fff" : "var(--m2)", transition: "all 0.15s",
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <button type="button" onClick={nextStep} className="btn btn-p btn-lg btn-full">
            Continue →
          </button>
          <div style={{ textAlign: "center", fontSize: "0.77rem", color: "var(--m1)", marginTop: "0.75rem" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "var(--m2)", fontWeight: 500 }}>Sign in</Link>
          </div>
        </div>
      )}

      {/* ── Step 2: Pro plan picker ── */}
      {step === 2 && (
        <div>
          {PRO_PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setProTier(plan.id)}
              className={`plan-opt${proTier === plan.id ? " sel" : ""}`}
              style={{ width: "100%", flexDirection: "column", alignItems: "flex-start" }}
            >
              <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--white)" }}>{plan.name}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--white)" }}>
                    {plan.price}<span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--m1)" }}>{plan.period}</span>
                  </div>
                </div>
                <div style={{
                  width: 15, height: 15, borderRadius: "50%",
                  border: `1.5px solid ${proTier === plan.id ? "var(--red)" : "var(--b3)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {proTier === plan.id && (
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)" }} />
                  )}
                </div>
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "var(--m2)", marginBottom: "0.2rem" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {f}
                  </div>
                ))}
              </div>
            </button>
          ))}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={prevStep} className="btn btn-g btn-lg" style={{ flex: 1 }}>Back</button>
            <button type="button" onClick={nextStep} className="btn btn-p btn-lg" style={{ flex: 1 }}>Continue →</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Name & username ── */}
      {step === 3 && (
        <form onSubmit={handleNameSubmit}>
          <div style={{ marginBottom: "0.85rem" }}>
            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 500, color: "var(--m2)", marginBottom: "0.35rem" }}>Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              style={inputStyle(!!errors.name)}
            />
            {errors.name && <div style={{ fontSize: "0.72rem", color: "var(--red)", marginTop: "0.25rem" }}>{errors.name}</div>}
          </div>
          <div style={{ marginBottom: "0.85rem" }}>
            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 500, color: "var(--m2)", marginBottom: "0.35rem" }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/^@+/, ""))}
              placeholder="john_doe"
              style={inputStyle(!!errors.username)}
            />
            {errors.username && <div style={{ fontSize: "0.72rem", color: "var(--red)", marginTop: "0.25rem" }}>{errors.username}</div>}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={prevStep} className="btn btn-g btn-lg" style={{ flex: 1 }}>Back</button>
            <button type="submit" className="btn btn-p btn-lg" style={{ flex: 1 }}>Continue →</button>
          </div>
        </form>
      )}

      {/* ── Step 4: Method ── */}
      {step === 4 && (
        <div>
          <button
            type="button"
            onClick={() => { setErrors({}); nextStep(); }}
            className="oauth-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Continue with Email
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", margin: "0.85rem 0", fontSize: "0.72rem", color: "var(--m1)" }}>
            <div style={{ flex: 1, height: 1, background: "var(--b2)" }} />or<div style={{ flex: 1, height: 1, background: "var(--b2)" }} />
          </div>

          <button type="button" onClick={handleGoogleSignup} disabled={googleLoading} className="oauth-btn">
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

          <button type="button" onClick={prevStep} className="btn btn-g btn-full" style={{ marginTop: "0.5rem" }}>
            Back
          </button>
        </div>
      )}

      {/* ── Step 5: Email credentials ── */}
      {step === 5 && (
        <form onSubmit={handleEmailSignup}>
          {[
            { label: "Email", key: "email", type: "email", placeholder: "you@example.com", value: email, onChange: setEmail },
            { label: "Password", key: "password", type: "password", placeholder: "••••••••", value: password, onChange: setPassword },
            { label: "Confirm password", key: "confirmPassword", type: "password", placeholder: "••••••••", value: confirmPassword, onChange: setConfirmPassword },
          ].map((field) => (
            <div key={field.key} style={{ marginBottom: "0.85rem" }}>
              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 500, color: "var(--m2)", marginBottom: "0.35rem" }}>{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                style={inputStyle(!!(errors as Record<string, string>)[field.key])}
              />
              {(errors as Record<string, string>)[field.key] && (
                <div style={{ fontSize: "0.72rem", color: "var(--red)", marginTop: "0.25rem" }}>
                  {(errors as Record<string, string>)[field.key]}
                </div>
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={prevStep} className="btn btn-g btn-lg" style={{ flex: 1 }}>Back</button>
            <button type="submit" disabled={loading} className="btn btn-p btn-lg" style={{ flex: 1 }}>
              {loading ? "Creating…" : "Create account →"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
