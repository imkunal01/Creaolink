"use client";

import { useState } from "react";
import Link from "next/link";
import AuthInput from "../components/AuthInput";

type PlanType = "personal" | "commercial";
type SignupProvider = "google" | "github";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [planType, setPlanType] = useState<PlanType>("personal");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [providerLoading, setProviderLoading] = useState<SignupProvider | null>(
    null
  );

  const validateStepTwo = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStepOneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStepTwoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStepTwo()) return;

    setStep(3);
  };

  const handleProviderSignup = async (provider: SignupProvider) => {
    setProviderLoading(provider);

    // TODO: Connect to backend OAuth flow
    console.log("Signup flow:", { planType, name, provider });
    setTimeout(() => setProviderLoading(null), 1200);
  };

  const stepTitle =
    step === 1 ? "Choose your plan" : step === 2 ? "What should we call you?" : "Finish sign up";
  const stepDescription =
    step === 1
      ? "Select how you plan to use CreaoLink"
      : step === 2
      ? "This helps personalize your workspace"
      : "Choose how you want to create your account";

  const providerButtonClass =
    "w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <>
      {/* Card */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 sm:p-8">
        <div className="mb-5 sm:mb-6">
          <p className="text-xs text-text-tertiary mb-2">Step {step} of 3</p>
          <h2 className="text-lg font-semibold text-text-primary">
            {stepTitle}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {stepDescription}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleStepOneSubmit}>
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => setPlanType("commercial")}
                className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  planType === "commercial"
                    ? "border-border-hover bg-bg-tertiary"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-text-primary">
                    I&apos;m working on commercial projects
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary border border-border">
                    Pro
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPlanType("personal")}
                className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  planType === "personal"
                    ? "border-border-hover bg-bg-tertiary"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-text-primary">
                    I&apos;m working on personal projects
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary border border-border">
                    Hobby
                  </span>
                </div>
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-all duration-200 cursor-pointer"
            >
              Continue
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStepTwoSubmit}>
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
                onClick={() => setStep(1)}
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

        {step === 3 && (
          <div>
            <div className="space-y-3 mb-6">
              <button
                type="button"
                disabled={providerLoading !== null}
                onClick={() => handleProviderSignup("google")}
                className={providerButtonClass}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                {providerLoading === "google"
                  ? "Connecting Google..."
                  : "Sign up with Google"}
              </button>

              <button
                type="button"
                disabled={providerLoading !== null}
                onClick={() => handleProviderSignup("github")}
                className={providerButtonClass}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 1.5a10.5 10.5 0 00-3.32 20.46c.53.1.72-.23.72-.5v-1.78c-2.95.64-3.57-1.24-3.57-1.24-.48-1.22-1.18-1.54-1.18-1.54-.96-.66.07-.65.07-.65 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.47 1.14 3.08.87.09-.68.37-1.15.67-1.42-2.36-.27-4.85-1.18-4.85-5.24 0-1.16.41-2.1 1.08-2.84-.11-.27-.47-1.36.1-2.83 0 0 .88-.28 2.88 1.08a9.95 9.95 0 015.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.47.21 2.56.1 2.83.67.74 1.08 1.68 1.08 2.84 0 4.07-2.5 4.96-4.88 5.22.38.33.72.99.72 2v2.96c0 .27.19.61.73.5A10.5 10.5 0 0012 1.5z" />
                </svg>
                {providerLoading === "github"
                  ? "Connecting GitHub..."
                  : "Sign up with GitHub"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={providerLoading !== null}
              className="w-full py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
