"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGetProject } from "@/lib/api";

type ProjectData = Awaited<ReturnType<typeof apiGetProject>>;

export default function LinkPremierePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <p className="text-error">{error || "Project not found"}</p>
        <button
          onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          className="text-sm text-text-tertiary hover:text-text-primary"
        >
          ← Back to Project
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <button
          onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          className="text-sm text-text-tertiary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1 mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to {project.title}
        </button>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-tertiary">
          Connect to Premiere Pro
        </h1>
        <p className="text-text-secondary mt-2">
          Link your Adobe Premiere Pro project to this platform to sync your timeline, sequences, and collaborate in real-time.
        </p>
      </div>

      {project.sync_code ? (
        <div className="bg-bg-secondary border border-border flex flex-col items-center justify-center p-12 rounded-2xl shadow-xl space-y-6">
          <div className="h-16 w-16 bg-accent/20 flex items-center justify-center rounded-2xl mb-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-text-primary">Your Plugin Link Code</h3>
            <p className="text-sm text-text-tertiary max-w-md mx-auto">
              Open the Creaolink extension in Adobe Premiere Pro and paste this code to establish a secure connection.
            </p>
          </div>

          <div className="w-full max-w-sm mt-4">
            <div className="bg-bg-tertiary border border-border p-4 rounded-xl flex items-center justify-between group">
              <code className="text-2xl font-mono tracking-widest text-text-primary">{project.sync_code}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(project.sync_code!);
                  alert("Code copied to clipboard!");
                }}
                className="p-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors cursor-pointer"
                title="Copy to clipboard"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border p-8 rounded-xl text-center space-y-4">
          <p className="text-error">No connection code available for this project.</p>
        </div>
      )}

      {/* Instructions */}
      <div className="space-y-4 pt-6">
        <h2 className="text-lg font-semibold text-text-primary">How to connect</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-bg-secondary border border-border p-5 rounded-xl space-y-3">
            <div className="h-8 w-8 bg-text-primary text-bg-primary rounded-full flex items-center justify-center font-bold text-sm">1</div>
            <h4 className="font-medium text-text-primary">Open Premiere Pro</h4>
            <p className="text-sm text-text-tertiary">Launch Adobe Premiere Pro and open your sequence.</p>
          </div>
          <div className="bg-bg-secondary border border-border p-5 rounded-xl space-y-3">
            <div className="h-8 w-8 bg-text-primary text-bg-primary rounded-full flex items-center justify-center font-bold text-sm">2</div>
            <h4 className="font-medium text-text-primary">Launch Plugin</h4>
            <p className="text-sm text-text-tertiary">Go to Window {">"} Extensions {">"} Creaolink in the top menu.</p>
          </div>
          <div className="bg-bg-secondary border border-border p-5 rounded-xl space-y-3">
            <div className="h-8 w-8 bg-text-primary text-bg-primary rounded-full flex items-center justify-center font-bold text-sm">3</div>
            <h4 className="font-medium text-text-primary">Paste Code</h4>
            <p className="text-sm text-text-tertiary">Paste the code above into the plugin to instantly connect.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
