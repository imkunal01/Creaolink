"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

interface VersionRow {
  id: string;
  project_id: string;
  version_name: string;
  notes: string;
  created_at: string;
  payload_size_bytes: number;
  has_timeline_data: boolean;
}

interface ProjectSummary {
  id: string;
  title: string;
  current_version_id: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AdminProjectVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // JSON Modal State
  const [inspectVersion, setInspectVersion] = useState<VersionRow | null>(null);
  const [timelineData, setTimelineData] = useState<unknown>(null);
  const [loadingJson, setLoadingJson] = useState(false);
  const [copied, setCopied] = useState(false);

  // Action Loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/admin/projects/${projectId}/versions`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load versions");
      }
      const data = await res.json();
      setProject(data.project);
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading versions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInspectJson = async (v: VersionRow) => {
    setInspectVersion(v);
    setLoadingJson(true);
    setCopied(false);
    try {
      const res = await apiFetch(`/api/admin/projects/${projectId}/versions/${v.id}`);
      if (!res.ok) throw new Error("Failed to load timeline JSON");
      const data = await res.json();
      setTimelineData(data.version.timeline_data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error inspecting JSON");
    } finally {
      setLoadingJson(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!confirm("Set this version as the project's active current version?")) return;
    setActionLoading(versionId);
    try {
      const res = await apiFetch(`/api/admin/projects/${projectId}/rollback`, {
        method: "POST",
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Rollback failed");
      }
      setProject((prev) => (prev ? { ...prev, current_version_id: versionId } : null));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error rolling back version");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearPayload = async (v: VersionRow) => {
    if (!confirm(`Are you sure you want to clear the timeline payload for "${v.version_name}"? This removes corrupted JSONB without deleting the version row.`)) {
      return;
    }
    setActionLoading(`clear-${v.id}`);
    try {
      const res = await apiFetch(`/api/admin/projects/${projectId}/versions/${v.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Clear failed");
      }
      setVersions((prev) =>
        prev.map((item) =>
          item.id === v.id
            ? { ...item, has_timeline_data: false, payload_size_bytes: 0 }
            : item
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error clearing payload");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyJson = () => {
    if (!timelineData) return;
    navigator.clipboard.writeText(JSON.stringify(timelineData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/admin/projects" className="hover:text-white transition">
              Projects
            </Link>
            <span>/</span>
            <Link href={`/admin/projects/${projectId}`} className="hover:text-white transition font-mono">
              {project?.title || projectId}
            </Link>
            <span>/</span>
            <span className="text-zinc-300">Timeline Versions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Timeline Versions & Payloads
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Inspect JSONB sequence structures synced from Premiere Pro UXP
          </p>
        </div>

        <Link
          href={`/admin/projects/${projectId}`}
          className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5 self-start"
        >
          ← Project Details
        </Link>
      </div>

      {/* Table Card */}
      <div className="rounded-xl bg-[#0c0d10] border border-white/[0.08] overflow-hidden">
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#121418]/60 text-zinc-400 font-mono">
                <th className="py-3 px-4 font-semibold uppercase">Version</th>
                <th className="py-3 px-4 font-semibold uppercase">Payload Status</th>
                <th className="py-3 px-4 font-semibold uppercase">Memory Size</th>
                <th className="py-3 px-4 font-semibold uppercase">Created At</th>
                <th className="py-3 px-4 font-semibold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-32 bg-white/5 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : versions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    No versions found for this project.
                  </td>
                </tr>
              ) : (
                versions.map((v) => {
                  const isCurrent = project?.current_version_id === v.id;
                  return (
                    <tr key={v.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-white">{v.version_name}</div>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Active Current
                            </span>
                          )}
                        </div>
                        {v.notes && <div className="text-[11px] text-zinc-500 mt-0.5">{v.notes}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        {v.has_timeline_data ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            Valid JSONB
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                            No Payload
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        {formatBytes(v.payload_size_bytes)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                        {new Date(v.created_at).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspectJson(v)}
                            className="px-2.5 py-1 rounded bg-[#121418] hover:bg-[#181b20] border border-white/10 text-zinc-300 hover:text-white transition font-medium text-xs flex items-center gap-1"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="16 18 22 12 16 6" />
                              <polyline points="8 6 2 12 8 18" />
                            </svg>
                            View JSON
                          </button>

                          {!isCurrent && (
                            <button
                              disabled={actionLoading === v.id}
                              onClick={() => handleRollback(v.id)}
                              className="px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold transition"
                            >
                              {actionLoading === v.id ? "Setting..." : "Set as Current"}
                            </button>
                          )}

                          {v.has_timeline_data && (
                            <button
                              disabled={actionLoading === `clear-${v.id}`}
                              onClick={() => handleClearPayload(v)}
                              title="Null out corrupted JSONB data"
                              className="p-1 rounded text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Inspector Modal */}
      {inspectVersion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-xl bg-[#0c0d10] border border-white/10 flex flex-col max-h-[85vh] shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Timeline JSON Payload:</span>
                  <span className="font-mono text-[#ff4b5c]">{inspectVersion.version_name}</span>
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  Size: {formatBytes(inspectVersion.payload_size_bytes)} | ID: {inspectVersion.id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  disabled={!timelineData}
                  className="px-2.5 py-1 rounded bg-[#121418] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copied ? "Copied!" : "Copy JSON"}
                </button>

                <button
                  onClick={() => setInspectVersion(null)}
                  className="p-1.5 rounded border border-white/10 text-zinc-400 hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-[#07080a]">
              {loadingJson ? (
                <div className="py-12 text-center text-zinc-500">Loading payload...</div>
              ) : !timelineData ? (
                <div className="py-12 text-center text-zinc-500">No timeline data stored in this version.</div>
              ) : (
                <pre className="text-emerald-400 whitespace-pre-wrap overflow-x-auto selection:bg-emerald-500/20">
                  {JSON.stringify(timelineData, null, 2)}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-white/[0.08] bg-[#0c0d10] flex justify-end">
              <button
                onClick={() => setInspectVersion(null)}
                className="px-3.5 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-300 hover:text-white"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
