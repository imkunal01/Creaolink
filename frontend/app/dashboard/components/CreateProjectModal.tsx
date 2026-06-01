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

  const inputStyle = {
    width: "100%",
    height: 40,
    padding: "0 11px",
    background: "var(--s3)",
    border: "1px solid var(--b2)",
    borderRadius: "var(--r)",
    fontSize: "0.81rem",
    color: "var(--white)",
    outline: "none",
    fontFamily: "var(--fb)",
    transition: "border-color 0.15s",
  } as React.CSSProperties;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "relative",
        width: "100%", maxWidth: 500,
        margin: "0 1rem",
        background: "var(--s1)",
        border: "1px solid var(--b2)",
        borderRadius: "var(--rxl)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.55)",
        maxHeight: "90dvh",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.1rem 1.4rem",
          borderBottom: "1px solid var(--b2)",
        }}>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--white)" }}>
              Create Project
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--m1)", marginTop: "0.1rem" }}>
              Set up a new workspace and invite collaborators
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "var(--r)",
              background: "var(--s3)", border: "1px solid var(--b2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--m2)", cursor: "pointer", flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "1.25rem 1.4rem" }}>
          {error && (
            <div style={{
              marginBottom: "1rem", padding: "0.6rem 0.85rem",
              background: "var(--rs)", border: "1px solid var(--rg)",
              borderRadius: "var(--r)", fontSize: "0.79rem", color: "var(--red)",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {/* Title */}
            <div>
              <label className="cl-label">Project Title <span style={{ color: "var(--red)" }}>*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Brand Video Campaign"
                style={inputStyle}
              />
            </div>

            {/* Description */}
            <div>
              <label className="cl-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief project overview…"
                rows={3}
                style={{
                  ...inputStyle,
                  height: "auto",
                  padding: "0.55rem 0.75rem",
                  resize: "none",
                }}
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="cl-label">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" } as React.CSSProperties}
              />
            </div>

            {/* Freelancer Emails */}
            <div>
              <label className="cl-label">
                Invite Freelancers{" "}
                <span style={{ color: "var(--m1)", fontWeight: 400 }}>(comma-separated emails)</span>
              </label>
              <input
                type="text"
                value={freelancerEmails}
                onChange={(e) => setFreelancerEmails(e.target.value)}
                placeholder="dev@email.com, designer@email.com"
                style={inputStyle}
              />
              <div style={{ fontSize: "0.71rem", color: "var(--m1)", marginTop: "0.3rem" }}>
                Freelancers must have an existing CreaoLink account.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.35rem" }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-g btn-lg"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-p btn-lg"
                style={{ flex: 1 }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      animation: "spin 0.8s linear infinite",
                      display: "inline-block",
                    }} />
                    Creating…
                  </span>
                ) : "Create project →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
