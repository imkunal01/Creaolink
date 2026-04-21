import { getUser } from "./auth";

const BASE = "";

function headers(): HeadersInit {
  const user = getUser();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (user) h["x-user-id"] = user.id;
  return h;
}

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...opts,
    headers: { ...headers(), ...(opts?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// ── Auth ──
export function apiLogin(email: string, password: string) {
  return request<{ user: { id: string; name: string; email: string; role: string } }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export function apiSignup(data: { name: string; email: string; password: string; role: string }) {
  return request<{ user: { id: string; name: string; email: string; role: string } }>(
    "/api/auth/signup",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function apiGoogleAuth(accessToken: string, role?: "client" | "freelancer") {
  return request<{ user: { id: string; name: string; email: string; role: string } }>(
    "/api/auth/google",
    { method: "POST", body: JSON.stringify({ accessToken, role }) }
  );
}

export function apiCheckSupabaseConnection() {
  return request<{
    ok: boolean;
    source: string;
    mode: "direct-db-url";
    dbHost: string;
    error?: string;
  }>(
    "/api/health/supabase"
  );
}

export const apiCheckDatabaseConnection = apiCheckSupabaseConnection;

// ── Projects ──
export function apiCreateProject(data: {
  title: string;
  description: string;
  deadline: string;
  freelancerEmails: string[];
}) {
  return request<{ project: Record<string, unknown>; currentVersion: Record<string, unknown> }>(
    "/api/projects",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function apiListProjects() {
  return request<{ projects: Array<Record<string, unknown>> }>("/api/projects");
}

export function apiGetProject(id: string) {
  return request<{
    id: string;
    title: string;
    description: string;
    status: string;
    deadline: string;
    sync_code: string;
    created_by: string;
    created_at: string;
    currentVersion: { id: string; version_name: string; notes: string; created_at: string } | null;
    versions: Array<{ id: string; version_name: string; notes: string; created_at: string }>;
    members: Array<{ id: string; name: string; email: string; role: string }>;
  }>(`/api/projects/${id}`);
}

// ── Status ──
export function apiUpdateStatus(projectId: string, status: string) {
  return request<{ project: Record<string, unknown> }>(`/api/projects/${projectId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ── Versions ──
export function apiCreateVersion(projectId: string, notes?: string) {
  return request<{
    currentVersion: { id: string; version_name: string; notes: string; created_at: string };
    versions: Array<{ id: string; version_name: string; notes: string; created_at: string }>;
  }>(`/api/projects/${projectId}/version`, {
    method: "POST",
    body: JSON.stringify({ notes: notes || "" }),
  });
}

// ── Feedback ──
export function apiAddFeedback(
  projectId: string,
  data: { type: string; priority: string; timestamp: string; description: string }
) {
  return request<{ feedback: Record<string, unknown> }>(`/api/projects/${projectId}/feedback`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function apiGetFeedback(projectId: string) {
  return request<{
    feedback: Array<{
      id: string;
      type: string;
      priority: string;
      timestamp: string;
      description: string;
      status: string;
      version_name: string;
      creator_name: string;
      created_at: string;
    }>;
  }>(`/api/projects/${projectId}/feedback`);
}

export function apiResolveFeedback(feedbackId: string) {
  return request<{ feedback: Record<string, unknown> }>(`/api/feedback/${feedbackId}/resolve`, {
    method: "PATCH",
  });
}
