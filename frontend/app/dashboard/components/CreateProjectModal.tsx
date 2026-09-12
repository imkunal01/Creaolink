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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-xl border border-white/[0.1] bg-[#141618] shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0d0e10]">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Create New Project Room
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Initialize a synced review workspace and timeline tracking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Project Title <span className="text-[#00e5ff]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Commercial Reel 2026 — v1 Cut"
                className="w-full h-10 px-3 rounded-md bg-[#1c1e22] border border-white/[0.08] text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00e5ff]/60 focus:ring-1 focus:ring-[#00e5ff]/20 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Description & Brief
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Target delivery dates, color grading notes, export formats..."
                rows={3}
                className="w-full p-3 rounded-md bg-[#1c1e22] border border-white/[0.08] text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00e5ff]/60 focus:ring-1 focus:ring-[#00e5ff]/20 transition-colors resize-none"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Delivery Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[#1c1e22] border border-white/[0.08] text-xs text-white outline-none focus:border-[#00e5ff]/60 focus:ring-1 focus:ring-[#00e5ff]/20 transition-colors [color-scheme:dark]"
              />
            </div>

            {/* Freelancer Emails */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Collaborators & Freelancers{" "}
                <span className="text-zinc-500 font-normal">(comma-separated emails)</span>
              </label>
              <input
                type="text"
                value={freelancerEmails}
                onChange={(e) => setFreelancerEmails(e.target.value)}
                placeholder="editor@studio.com, colorist@post.com"
                className="w-full h-10 px-3 rounded-md bg-[#1c1e22] border border-white/[0.08] text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00e5ff]/60 focus:ring-1 focus:ring-[#00e5ff]/20 transition-colors"
              />
              <p className="text-[11px] font-mono text-zinc-500 mt-1">
                Collaborators will receive access to timeline review and comments.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-g btn-lg flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-p btn-lg flex-1"
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
