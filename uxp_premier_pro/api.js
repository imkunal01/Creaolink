const API_BASE_URL = "http://localhost:3000";  // swap for your real URL
const SYNC_ENDPOINT = `${API_BASE_URL}/api/plugin/sync`;
const LINK_ENDPOINT = `${API_BASE_URL}/api/plugin/link`;
const TIMEOUT_MS = 15000;  // 15 seconds — generous for large timelines

// ─── Verify Link Code ────────────────────────────────────

async function verifyLinkCode(code) {
  if (!code) throw new Error("Sync code is missing");

  const response = await fetchWithTimeout(`${LINK_ENDPOINT}?code=${encodeURIComponent(code)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  }, 10000);

  if (!response.ok) {
    const errorBody = await safeReadBody(response);
    throw new Error(errorBody?.error || "Invalid sync code or project not found.");
  }

  const result = await safeReadBody(response);
  return result; // { success: true, projectId, projectName, currentVersionId }
}

// ─── Core sync function ──────────────────────────────────

async function syncToBackend(projectId, versionId, timelineData) {
  if (!projectId || !versionId) {
    throw new Error("Not linked — missing project credentials");
  }

  if (!timelineData) {
    throw new Error("No timeline data to sync");
  }

  const payload = {
    projectId: projectId,
    versionId: versionId,
    timelineData: timelineData
  };

  // UXP supports fetch() natively — no import needed
  const response = await fetchWithTimeout(SYNC_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Plugin-Version": "1.0.0"
    },
    body: JSON.stringify(payload)
  }, TIMEOUT_MS);

  // Handle HTTP-level errors (4xx, 5xx)
  if (!response.ok) {
    const errorBody = await safeReadBody(response);
    throw new Error(buildErrorMessage(response.status, errorBody));
  }

  // Parse and return success response
  const result = await safeReadBody(response);
  return {
    success: true,
    message: result?.message || "Sync complete",
    syncedAt: new Date().toISOString()
  };
}

// ─── Timeout wrapper ─────────────────────────────────────

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out — server took too long to respond");
    }
    // Network failure — no connection, DNS failure, etc.
    throw new Error("Network error — check your internet connection");
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Safe body reader ─────────────────────────────────────
// Tries JSON first, falls back to plain text
// Never throws — always returns something usable

async function safeReadBody(response) {
  try {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  } catch {
    return null;
  }
}

// ─── Human-readable error messages ───────────────────────

function buildErrorMessage(status, body) {
  // Use backend's own message if it sent one
  const backendMessage = body?.message || body?.error || null;

  const statusMessages = {
    400: "Bad request — timeline data was rejected by the server",
    401: "Unauthorized — your sync token is invalid or expired",
    403: "Forbidden — you don't have access to this project",
    404: "Project not found — check your Project ID",
    409: "Conflict — a sync is already in progress for this project",
    422: "Invalid data — the server couldn't process the timeline",
    429: "Too many requests — wait a moment and try again",
    500: "Server error — something went wrong on the CreaoLink backend",
    502: "Server unreachable — CreaoLink may be down",
    503: "Service unavailable — try again in a few minutes"
  };

  const fallback = statusMessages[status]
    || `Unexpected error (HTTP ${status})`;

  return backendMessage
    ? `${backendMessage} (${status})`
    : fallback;
}

module.exports = { syncToBackend, verifyLinkCode };