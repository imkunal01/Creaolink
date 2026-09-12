"use client";

import React, { useState } from "react";
import Link from "next/link";
import MinimalNavbar from "../components/MinimalNavbar";
import MinimalFooter from "../components/MinimalFooter";

export default function PremiereSetupPage() {
  const [activeTab, setActiveTab] = useState<"ccx" | "zip">("ccx");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const faqs = [
    {
      q: "Where do I find my Project Sync Code?",
      a: "Open your project in Creaolink Dashboard and click the 'Premiere Pro Sync' button in the top action bar. You will see your 6-character Workspace Sync Code.",
    },
    {
      q: "The plugin does not appear in Premiere Pro.",
      a: "Make sure Premiere Pro is v22.0 (2022) or newer. After installing via Creative Cloud Desktop, restart Premiere Pro completely so the extension is loaded under Window > Extensions.",
    },
    {
      q: "Does CreaoLink upload video files?",
      a: "No. CreaoLink only streams lightweight sequence metadata (clip names, cut timestamps, tracks, and markers). Your raw video footage stays 100% on your local computer.",
    },
    {
      q: "How do I update my timeline on the web?",
      a: "Whenever you edit your sequence in Premiere Pro, just click 'Sync Timeline' in the CreaoLink panel. The web dashboard will update instantly.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090a0d] text-neutral-200 font-sans flex flex-col justify-between selection:bg-white/20">
      {/* Top Navigation */}
      <MinimalNavbar />

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 sm:px-8 pt-32 pb-20 space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-neutral-600">/</span>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-200">Premiere Setup</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-[11px] font-mono text-neutral-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              UXP Plugin v1.0.0 &middot; Premiere Pro 2022+
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Adobe Premiere Pro Setup Guide
            </h1>
            <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
              Install the CreaoLink extension to sync timeline cuts, markers, and track metadata directly with your project room.
            </p>
          </div>
        </div>

        {/* Download Action Card */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Download CreaoLink Plugin
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Compatible with macOS (Apple Silicon & Intel) and Windows 10/11.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href="/api/plugin/download?format=ccx"
                download="creaolink-premiere-v1.0.0.ccx"
                className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download .CCX (1-Click)</span>
              </a>

              <a
                href="/api/plugin/download?format=zip"
                download="creaolink-premiere-v1.0.0.zip"
                title="Download .zip source for Adobe UXP Developer Tool"
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                .ZIP
              </a>
            </div>
          </div>
        </div>

        {/* Setup Steps Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Installation Steps
            </h2>

            {/* Simple method switch */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("ccx")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === "ccx"
                    ? "bg-white text-black font-medium"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Standard (.ccx)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("zip")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === "zip"
                    ? "bg-white text-black font-medium"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Developer (.zip)
              </button>
            </div>
          </div>

          {/* TAB 1: STANDARD CCX STEPS */}
          {activeTab === "ccx" && (
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-white font-mono text-xs font-bold mt-0.5">
                  1
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    Install with Creative Cloud
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Double-click the downloaded <code className="text-neutral-200 font-mono">creaolink-premiere-v1.0.0.ccx</code> file. Adobe Creative Cloud Desktop will open and prompt you to install. Click <strong>Install Locally</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-white font-mono text-xs font-bold mt-0.5">
                  2
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-semibold text-white">
                    Open Extension in Premiere Pro
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Launch Adobe Premiere Pro and open your project. In the top menu, click:
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-neutral-200">
                    <span>Window &gt; Extensions &gt; CreaoLink</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("Window > Extensions > CreaoLink")}
                      className="text-neutral-400 hover:text-white cursor-pointer ml-1"
                      title="Copy path"
                    >
                      {copiedText === "Window > Extensions > CreaoLink" ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-white font-mono text-xs font-bold mt-0.5">
                  3
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-semibold text-white">
                    Connect Your Project Room
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Click <strong>Link Project</strong> in the panel. Enter the 6-character Workspace Sync Code from your Creaolink project room and click <strong>Connect</strong>.
                  </p>
                  <Link
                    href="/dashboard/projects"
                    className="inline-flex items-center gap-1 text-xs text-white underline underline-offset-4 hover:text-neutral-300 font-medium"
                  >
                    Find your project sync code &rarr;
                  </Link>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold mt-0.5">
                  4
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    Sync Sequence Timeline
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Click <strong>Sync Timeline</strong> anytime to push active cuts, markers, and track structures to the cloud for real-time review.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEVELOPER ZIP STEPS */}
          {activeTab === "zip" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-white font-mono text-xs font-bold mt-0.5">
                  1
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    Extract ZIP Archive
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Extract <code className="text-neutral-200 font-mono">creaolink-premiere-v1.0.0.zip</code> to any local folder on your machine.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-white font-mono text-xs font-bold mt-0.5">
                  2
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    Open Adobe UXP Developer Tool (UDT)
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Launch Adobe UXP Developer Tool (available inside Creative Cloud Desktop).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-white font-mono text-xs font-bold mt-0.5">
                  3
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    Add Manifest &amp; Load
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Click <strong>Add Plugin</strong>, select <code className="text-neutral-200 font-mono">manifest.json</code> from the extracted folder, and click <strong>Actions (&bull;&bull;&bull;) &gt; Load</strong> to launch the extension in Premiere Pro.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Link Quick Helper */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-white">
              Already have an active project?
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">
              Open your project room to copy your sync token.
            </div>
          </div>
          <Link
            href="/dashboard/projects"
            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors shrink-0 text-center"
          >
            Open Project Rooms &rarr;
          </Link>
        </div>

        {/* Frequently Asked Questions */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 font-mono">
            Common Questions
          </h2>

          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-white/10 bg-white/[0.015] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-semibold text-neutral-200 hover:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-neutral-500 text-xs font-mono shrink-0">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 text-xs text-neutral-400 leading-relaxed border-t border-white/[0.05] pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <MinimalFooter />
    </div>
  );
}
