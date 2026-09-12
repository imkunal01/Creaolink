"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinkClass = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "bg-zinc-800 text-white border border-white/10"
      : "text-zinc-400 hover:text-white"
  }`;

export default function AuthNavbar() {
  const pathname = usePathname();

  const onLogin = pathname === "/auth/login";
  const onSignup = pathname === "/auth/signup";

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#08090a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-sans text-base font-bold tracking-tight text-white">
          Creao<span className="text-[#00e5ff]">Link</span>
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
            className="ml-1 rounded-md border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
