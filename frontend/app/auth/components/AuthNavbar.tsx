"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinkClass = (active: boolean) =>
  `rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
    active
      ? "bg-white text-black font-semibold shadow-sm"
      : "text-neutral-400 hover:text-white hover:bg-white/5"
  }`;

export default function AuthNavbar() {
  const pathname = usePathname();

  const onLogin = pathname === "/auth/login";
  const onSignup = pathname === "/auth/signup";

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#07080a]/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-7 h-7 flex items-center justify-center rounded-lg overflow-hidden bg-white/5 border border-white/10 group-hover:border-white/25 transition-colors">
            <Image
              src="/favicon.ico"
              alt="Creaolink Logo"
              width={20}
              height={20}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-sm tracking-tight text-white/95 group-hover:text-white transition-colors">
            Creaolink
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Auth navigation">
          <Link href="/auth/login" className={navLinkClass(onLogin)}>
            Login
          </Link>
          <Link href="/auth/signup" className={navLinkClass(onSignup)}>
            Sign up
          </Link>
          <Link
            href="/dashboard"
            className="ml-1 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-1.5 text-xs text-neutral-300 transition-all hover:bg-white/10 hover:text-white"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
