"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGetProject } from "@/lib/api";

type ProjectData = Awaited<ReturnType<typeof apiGetProject>>;

const STEPS = [
  {
    num: 1,
    title: "Open Premiere Pro",
    desc: "Launch Adobe Premiere Pro and open the sequence you want to sync.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    num: 2,
    title: "Launch Plugin",
    desc: "Go to Window → Extensions → CreaoLink in the Premiere Pro top menu bar.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    num: 3,
    title: "Paste the Code",
    desc: "Enter the sync code from above into the plugin field and click Connect.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="mc" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: "2.5px solid var(--b2)", borderTopColor: "var(--red)",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  /* ── Error ── */
  if (error || !project) {
    return (
      <div className="mc" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: "1rem" }}>
        <div style={{
          padding: "0.65rem 1rem", background: "var(--rs)", border: "1px solid var(--rg)",
          borderRadius: "var(--r)", fontSize: "0.82rem", color: "var(--red)",
        }}>
          {error || "Project not found"}
        </div>
        <button onClick={() => router.push(`/dashboard/projects/${projectId}`)} style={{
          fontSize: "0.78rem", color: "var(--m1)", background: "none", border: "none", cursor: "pointer",
        }}>
          ← Back to Project
        </button>
      </div>
    );
  }

  return (
    <div className="mc" style={{ maxWidth: 760, paddingBottom: "3rem" }}>
      {/* Back link */}
      <button
        onClick={() => router.push(`/dashboard/projects/${projectId}`)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: "0.77rem", color: "var(--m1)", background: "none",
          border: "none", cursor: "pointer", marginBottom: "1.5rem",
          fontFamily: "var(--fb)", transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--m2)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--m1)")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to {project.title}
      </button>

      {/* Hero section */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {/* PR logo badge */}
        <div style={{
          width: 52, height: 52, borderRadius: "var(--rl)",
          background: "linear-gradient(135deg, #9999ff22, #9999ff11)",
          border: "1px solid #9999ff44",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "var(--fd)", fontSize: "1.05rem", fontWeight: 700, color: "#a78bfa", fontStyle: "italic" }}>Pr</span>
        </div>
        <div>
          <div style={{ fontFamily: "var(--fd)", fontSize: "1.5rem", color: "var(--white)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Connect to Premiere Pro
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--m1)", marginTop: "0.25rem", lineHeight: 1.6 }}>
            Sync your Adobe Premiere Pro timeline with <strong style={{ color: "var(--m2)" }}>{project.title}</strong> in real time.
          </div>
        </div>
      </div>

      {/* Code card */}
      {project.sync_code ? (
        <div style={{
          background: "var(--s1)",
          border: "1px solid var(--b2)",
          borderRadius: "var(--rxl)",
          overflow: "hidden",
          marginBottom: "1.5rem",
          boxShadow: "0 0 0 1px rgba(167,139,250,0.06), 0 20px 60px rgba(0,0,0,0.3)",
        }}>
          {/* Card top bar */}
          <div style={{
            padding: "0.85rem 1.5rem",
            borderBottom: "1px solid var(--b2)",
            background: "linear-gradient(to right, rgba(167,139,250,0.06), transparent)",
            display: "flex", alignItems: "center", gap: "0.6rem",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--m2)" }}>Plugin sync code ready</span>
            <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--m1)" }}>Project: {project.title}</span>
          </div>

          <div style={{ padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
            {/* Plug icon */}
            <div style={{
              width: 64, height: 64, borderRadius: "var(--rxl)",
              background: "rgba(167,139,250,0.1)",
              border: "1px solid rgba(167,139,250,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#a78bfa",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--white)", marginBottom: "0.35rem" }}>
                Your Plugin Sync Code
              </div>
              <div style={{ fontSize: "0.79rem", color: "var(--m1)", maxWidth: 360, lineHeight: 1.6 }}>
                Open the CreaoLink extension inside Adobe Premiere Pro and paste this code to establish a secure connection.
              </div>
            </div>

            {/* Code display */}
            <div style={{
              display: "flex", alignItems: "center",
              background: "var(--s3)", border: "1px solid var(--b3)",
              borderRadius: "var(--rl)", padding: "0.85rem 1.25rem",
              gap: "1.25rem", width: "100%", maxWidth: 380,
            }}>
              <code style={{
                flex: 1, fontSize: "1.6rem", fontWeight: 700,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                letterSpacing: "0.22em", color: "var(--white)",
                textAlign: "center",
              }}>
                {project.sync_code}
              </code>
              <button
                onClick={handleCopy}
                title="Copy code"
                style={{
                  width: 40, height: 40, borderRadius: "var(--r)", flexShrink: 0,
                  background: copied ? "rgba(74,222,128,0.12)" : "var(--s4)",
                  border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "var(--b2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: copied ? "#4ade80" : "var(--m2)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>

            {copied && (
              <div style={{
                fontSize: "0.75rem", color: "#4ade80",
                display: "flex", alignItems: "center", gap: 5,
                animation: "fade-in 0.2s ease",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied to clipboard!
              </div>
            )}

            <div style={{ fontSize: "0.7rem", color: "var(--m1)", textAlign: "center", lineHeight: 1.55 }}>
              This code is unique to this project and does not expire.<br />
              Keep it private — it provides write access to your timeline sync.
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: "2rem",
          background: "var(--rs)", border: "1px solid var(--rg)",
          borderRadius: "var(--rxl)", textAlign: "center",
          fontSize: "0.82rem", color: "var(--red)", marginBottom: "1.5rem",
        }}>
          No sync code is available for this project.
        </div>
      )}

      {/* How to connect */}
      <div>
        <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--m1)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem" }}>
          How to connect
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "0.85rem" }}>
          {STEPS.map((step) => (
            <div key={step.num} style={{
              background: "var(--s2)",
              border: "1px solid var(--b2)",
              borderRadius: "var(--rl)",
              padding: "1.1rem 1.15rem",
              transition: "border-color 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.65rem" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "var(--r)",
                  background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#a78bfa", flexShrink: 0,
                }}>
                  {step.icon}
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: "var(--s4)", border: "1px solid var(--b2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700, color: "var(--m1)",
                }}>
                  {step.num}
                </div>
              </div>
              <div style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--white)", marginBottom: "0.35rem" }}>
                {step.title}
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--m1)", lineHeight: 1.6 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plugin download hint */}
      <div style={{
        marginTop: "1.25rem",
        padding: "0.85rem 1.1rem",
        background: "var(--s2)", border: "1px solid var(--b2)",
        borderRadius: "var(--rl)",
        display: "flex", alignItems: "center", gap: "0.85rem",
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "var(--r)",
          background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#a78bfa", flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.79rem", fontWeight: 500, color: "var(--white)", marginBottom: "0.15rem" }}>
            Don&apos;t have the plugin yet?
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--m1)" }}>
            Download the CreaoLink UXP plugin for Adobe Premiere Pro from your workspace settings or the Adobe Exchange marketplace.
          </div>
        </div>
      </div>
    </div>
  );
}
