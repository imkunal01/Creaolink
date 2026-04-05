"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinkClass = (active: boolean) =>
  `rounded-md px-3 py-2 text-sm transition-colors ${
    active
      ? "bg-bg-tertiary text-text-primary"
      : "text-text-secondary hover:text-text-primary"
  }`;

export default function AuthNavbar() {
  const pathname = usePathname();

  const onLogin = pathname === "/auth/login";
  const onSignup = pathname === "/auth/signup";

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight text-text-primary">
          CreaoLink
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Auth navigation">
          <Link href="/auth/login" className={navLinkClass(onLogin)}>
            Login
          </Link>
          <Link href="/auth/signup" className={navLinkClass(onSignup)}>
            Sign up
          </Link>
          <Link
            href="/dashboard"
            className="ml-1 rounded-md border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
