"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGetProject } from "@/lib/api";

type ProjectData = Awaited<ReturnType<typeof apiGetProject>>;

const STEPS = [
  {
    num: 1,
    title: "Open Premiere Pro",
    desc: "Launch Adobe Premiere Pro and open the sequence timeline you want to sync.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    num: 2,
    title: "Launch UXP Extension",
    desc: "Navigate to Window > Extensions > CreaoLink in the Premiere Pro menu bar.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    num: 3,
    title: "Authenticate Sync",
    desc: "Paste the sync code below into the panel field and click Connect Timeline.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
  },
];

export default function LinkPremierePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchProject = async () => {
    try {
      const data = await apiGetProject(projectId);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleCopy = () => {
    if (!project?.sync_code) return;
    navigator.clipboard.writeText(project.sync_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="mc flex items-center justify-center h-80">
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#00e5ff] animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mc flex flex-col items-center justify-center h-80 gap-3 text-center">
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400">
          {error || "Project room not found"}
        </div>
        <Link href={`/dashboard/projects/${projectId}`} className="text-xs text-zinc-400 hover:text-white">
          &larr; Return to Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="mc max-w-3xl pb-12">
      {/* Back link */}
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to {project.title}
      </Link>

      {/* Hero section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] font-mono font-bold text-lg shrink-0">
          Pr
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Connect to Premiere Pro
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sync sequence timelines from Adobe Premiere Pro directly into <span className="text-white font-medium">{project.title}</span>.
          </p>
        </div>
      </div>

      {/* Code card */}
      {project.sync_code ? (
        <div className="rounded-xl border border-white/[0.1] bg-[#141618] overflow-hidden mb-8 shadow-2xl">
          {/* Card Top bar */}
          <div className="px-5 py-3 border-b border-white/[0.08] bg-[#0d0e10] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
              <span className="text-xs font-mono font-medium text-white">Plugin Connection Ready</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[200px]">
              {project.title}
            </span>
          </div>

          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Workspace Sync Token
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mt-1">
                Enter this code in your CreaoLink UXP panel to stream clips, tracks, and markers.
              </p>
            </div>

            {/* Code Box */}
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-lg bg-[#0d0e10] border border-white/[0.1] w-full max-w-md">
              <code className="flex-1 font-mono text-2xl font-bold tracking-[0.25em] text-white text-center select-all">
                {project.sync_code}
              </code>
              <button
                onClick={handleCopy}
                title="Copy code"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer ${
                  copied
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-[#1c1e22] border-white/[0.08] text-zinc-300 hover:text-white"
                }`}
              >
                {copied ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>

            {copied && (
              <span className="text-xs font-mono text-emerald-400">
                Copied to clipboard
              </span>
            )}

            <p className="text-[11px] font-mono text-zinc-500 max-w-md">
              Sync token gives direct sequence telemetry access to this workspace.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs font-mono text-red-400 mb-8">
          No sync token available for this workspace.
        </div>
      )}

      {/* How to connect */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Setup Instructions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="p-4 rounded-xl border border-white/[0.08] bg-[#141618] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-[#00e5ff]/15 text-[#00e5ff]">
                  {step.icon}
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0d0e10] border border-white/[0.08] font-mono text-[10px] text-zinc-400">
                  {step.num}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-white">
                {step.title}
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
