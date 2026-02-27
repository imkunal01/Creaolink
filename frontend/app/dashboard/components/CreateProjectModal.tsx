"use client";

import { useState } from "react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: { id: string }) => void;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [freelancerInput, setFreelancerInput] = useState("");
  const [freelancerEmails, setFreelancerEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const addFreelancer = () => {
    const email = freelancerInput.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      return;
    }
    if (freelancerEmails.includes(email)) {
      setError("Email already added");
      return;
    }
    setFreelancerEmails([...freelancerEmails, email]);
    setFreelancerInput("");
    setError("");
  };

  const removeFreelancer = (email: string) => {
    setFreelancerEmails(freelancerEmails.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Dynamic import to avoid SSR issues
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          deadline: deadline || undefined,
          freelancerEmails:
            freelancerEmails.length > 0 ? freelancerEmails : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create project");
        setLoading(false);
        return;
      }

      const data = await res.json();
      onCreated(data.project);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFreelancer();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border rounded-xl w-full max-w-[520px] mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">
            Create Project
          </h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Project Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the project scope..."
              rows={3}
              className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors resize-none"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-border-hover transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Freelancer Emails */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Assign Freelancers
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={freelancerInput}
                onChange={(e) => {
                  setFreelancerInput(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="freelancer@email.com"
                className="flex-1 px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors"
              />
              <button
                type="button"
                onClick={addFreelancer}
                className="px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Email chips */}
            {freelancerEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {freelancerEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-tertiary border border-border rounded-full text-xs text-text-secondary"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeFreelancer(email)}
                      className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-text-tertiary mt-1.5">
              Freelancers must have an existing account to be added.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
