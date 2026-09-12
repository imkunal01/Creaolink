"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiCreateProject } from "@/lib/api";

interface CreateProjectModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onCreated?: (project: { id: string }) => void;
}

export default function CreateProjectModal({
  open,
  isOpen,
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [freelancerEmails, setFreelancerEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const modalOpen = isOpen ?? open ?? false;

  if (!modalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project title is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const emails = freelancerEmails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      const { project } = await apiCreateProject({
        title: title.trim(),
        description: description.trim(),
        deadline,
        freelancerEmails: emails,
      });
      onClose();
      const createdProject = project as { id: string };
      if (onCreated) {
        onCreated(createdProject);
      } else {
        router.push(`/dashboard/projects/${createdProject.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-2xl"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#0c0e14]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden max-h-[90dvh] flex flex-col z-10 text-white my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/[0.08] bg-white/[0.02]">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Create New Project Room
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Initialize a synced review workspace and timeline tracking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto">
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Project Title <span className="text-white">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Commercial Reel 2026 — v1 Cut"
                className="w-full h-11 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-white placeholder:text-neutral-600 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Description &amp; Brief
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Target delivery dates, color grading notes, export formats..."
                rows={3}
                className="w-full p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-white placeholder:text-neutral-600 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors resize-none"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Delivery Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-white outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors [color-scheme:dark]"
              />
            </div>

            {/* Freelancer Emails */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Collaborators &amp; Freelancers{" "}
                <span className="text-neutral-500 font-normal">(comma-separated emails)</span>
              </label>
              <input
                type="text"
                value={freelancerEmails}
                onChange={(e) => setFreelancerEmails(e.target.value)}
                placeholder="editor@studio.com, colorist@post.com"
                className="w-full h-11 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-white placeholder:text-neutral-600 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
              />
              <p className="text-[11px] font-mono text-neutral-500 mt-1">
                Collaborators will receive access to timeline review and comments.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(255,255,255,0.18)] cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? "Creating..." : "Create Project Room"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
