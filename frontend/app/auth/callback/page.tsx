"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setUser, type UserRole } from "@/lib/auth";
import { apiGoogleAuth } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

type Status = "loading" | "error";

async function waitForAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  for (let i = 0; i < 8; i += 1) {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session?.access_token) return data.session.access_token;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const completeAuth = async () => {
      try {
        const roleParam = searchParams.get("role");
        const role = roleParam === "freelancer" ? "freelancer" : "client";

        const accessToken = await waitForAccessToken();
        if (!accessToken) {
          throw new Error("Could not verify Google session. Please try again.");
        }

        const { user } = await apiGoogleAuth(accessToken, role);

        if (cancelled) return;

        setUser({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        });

        router.replace("/dashboard");
      } catch (err: unknown) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Google login failed");
      }
    };

    completeAuth();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg-secondary p-6 text-center">
        {status === "loading" ? (
          <>
            <p className="text-sm text-text-secondary">Finalizing Google sign in...</p>
          </>
        ) : (
          <>
            <p className="text-sm text-error">{error || "Google login failed"}</p>
            <button
              type="button"
              onClick={() => router.replace("/auth/login")}
              className="mt-4 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CallbackFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg-secondary p-6 text-center">
        <p className="text-sm text-text-secondary">Finalizing Google sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackContent />
    </Suspense>
  );
}
