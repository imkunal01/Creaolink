"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProject } from "@/lib/hooks/use-projects";

const STEPS = [
  {
    num: 1,
    title: "Install Plugin",
    desc: "Download and double-click the .ccx plugin package to install in Adobe Creative Cloud.",
  },
  {
    num: 2,
    title: "Open in Premiere",
    desc: "In Premiere Pro menu, navigate to Window > Extensions > CreaoLink.",
  },
  {
    num: 3,
    title: "Enter Sync Code",
    desc: "Paste your sync code in the panel and click Connect Timeline.",
  },
];

export default function LinkPremierePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { project, isLoading: loadingProject, error: projectError } = useProject(projectId);
  const [copied, setCopied] = useState(false);

  const loading = loadingProject && !project;
  const error = projectError ? (projectError instanceof Error ? projectError.message : "Failed to load project") : "";

  const handleCopy = () => {
    if (!project?.sync_code) return;
    navigator.clipboard.writeText(project.sync_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 space-y-6">
        <div className="h-5 w-40 rounded bg-white/[0.05] animate-pulse" />
        <div className="h-32 rounded-xl bg-white/[0.03] animate-pulse" />
        <div className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center space-y-3">
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400">
          {error || "Project room not found"}
        </div>
        <Link href={`/dashboard/projects/${projectId}`} className="text-xs text-neutral-400 hover:text-white">
          &larr; Return to Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
      {/* Back link */}
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
      >
        &larr; Back to {project.title}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Connect Premiere Pro
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Link sequence timelines from Adobe Premiere Pro directly into <span className="text-white font-medium">{project.title}</span>.
          </p>
        </div>

        <Link
          href="/premiere-setup"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors shrink-0"
        >
          <span>Full Setup Guide</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* Download Plugin Bar */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-white">
            CreaoLink Premiere Plugin (UXP)
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Install the plugin to enable live timeline sync.
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/api/plugin/download?format=ccx"
            download="creaolink-premiere-v1.0.0.ccx"
            className="px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download .CCX</span>
          </a>

          <a
            href="/api/plugin/download?format=zip"
            download="creaolink-premiere-v1.0.0.zip"
            title="Download Source / Developer ZIP"
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            .ZIP
          </a>
        </div>
      </div>

      {/* Code card */}
      {project.sync_code ? (
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 text-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Workspace Sync Token
            </div>
            <p className="text-xs text-neutral-400">
              Enter this code in your CreaoLink panel inside Premiere Pro.
            </p>
          </div>

          {/* Code Box */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 max-w-sm mx-auto">
            <code className="flex-1 font-mono text-xl font-bold tracking-[0.2em] text-white select-all">
              {project.sync_code}
            </code>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-white/10 border-white/10 text-white hover:bg-white/15"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs font-mono text-red-400">
          No sync token available for this workspace.
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
          How to connect
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {step.title}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  0{step.num}
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
