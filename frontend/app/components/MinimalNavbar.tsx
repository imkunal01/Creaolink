"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthModal } from "./AuthModalContext";

export default function MinimalNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openAuthModal } = useAuthModal();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-7 h-7 flex items-center justify-center rounded-lg overflow-hidden bg-white/5 border border-white/10 group-hover:border-white/25 transition-colors">
            <Image
              src="/favicon.ico"
              alt="Creaolink Logo"
              width={22}
              height={22}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-base tracking-tight text-white/95 group-hover:text-white transition-colors">
            Creaolink
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-neutral-300">
          <Link
            href="#features"
            className="hover:text-white transition-colors duration-200"
          >
            Product
          </Link>
          <div className="relative group cursor-pointer flex items-center gap-1 hover:text-white transition-colors">
            <span>Solutions</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:rotate-180 text-neutral-400"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <Link
            href="#metrics"
            className="hover:text-white transition-colors duration-200"
          >
            Performance
          </Link>
          <Link
            href="#pricing"
            className="hover:text-white transition-colors duration-200"
          >
            Pricing
          </Link>
          <Link
            href="/dashboard"
            className="hover:text-white transition-colors duration-200"
          >
            Docs
          </Link>
        </nav>

        {/* Right Actions: Login & High-Contrast Pill Button */}
        <div className="hidden md:flex items-center gap-5">
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="text-[13.5px] font-medium text-neutral-300 hover:text-white transition-colors px-3 py-1.5 cursor-pointer"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => openAuthModal("signup")}
            className="px-5 py-2 rounded-full bg-white text-black font-semibold text-[13.5px] hover:bg-neutral-100 transition-all duration-200 hover:scale-[1.03] shadow-[0_0_24px_rgba(255,255,255,0.18)] flex items-center gap-1.5 cursor-pointer"
          >
            <span>Sign up</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 8h16M4 16h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 p-4 rounded-2xl bg-[#0e0f14]/95 border border-white/10 backdrop-blur-xl flex flex-col gap-3.5 text-sm font-medium text-neutral-200 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            Product
          </Link>
          <Link
            href="#metrics"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            Performance
          </Link>
          <Link
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            Pricing
          </Link>
          <div className="h-px bg-white/10 my-1" />
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openAuthModal("login");
              }}
              className="flex-1 text-center py-2.5 rounded-full border border-white/15 text-white font-medium hover:bg-white/5 transition-colors text-xs cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openAuthModal("signup");
              }}
              className="flex-1 text-center py-2.5 rounded-full bg-white text-black font-semibold hover:bg-neutral-100 transition-colors text-xs cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

