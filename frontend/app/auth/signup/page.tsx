"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthInput from "../components/AuthInput";
import RoleSelector from "../components/RoleSelector";
import { setUser, type UserRole } from "@/lib/auth";
import { apiSignup } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"client" | "freelancer">("client");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Must be at least 6 characters";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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

  return (
    <>
      {/* Card */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 sm:p-8">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Create your account
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Get started with CreaoLink
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <AuthInput
            label="Full name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={setName}
            error={errors.name}
          />

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

          <div className="mb-4">
            <span className="text-xs text-text-tertiary">I am a</span>
          </div>

          <RoleSelector selected={role} onChange={setRole} />

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
                Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>
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
