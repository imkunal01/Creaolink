const { entrypoints } = require("uxp");
const { extractTimelineData, buildCleanJSON } = require("./timeline.js");
const { syncToBackend } = require("./api.js");
const {
  saveCredentials,
  loadCredentials,
  clearCredentials
} = require("./storage.js");

// ─── Panel lifecycle ─────────────────────────────────────

entrypoints.setup({
  panels: {
    "creaolink-panel": {
      async show() {
        await initPanel();
      }
    }
  }
});

async function initPanel() {
  try {
    const credentials = await loadCredentials();

    if (credentials) {
      setLinkedState(credentials.projectId, credentials.linkedAt);
    } else {
      setUnlinkedState();
    }
  } catch (e) {
    updateStatus("Failed to load credentials", "error");
  }
}

// ─── UI state helpers ────────────────────────────────────

function setLinkedState(projectId, linkedAt) {
  const statusEl = document.getElementById("connection-status");
  statusEl.textContent = `Connected to: ${projectId}`;
  if (linkedAt) {
    const date = new Date(linkedAt).toLocaleDateString();
    statusEl.textContent += ` (linked ${date})`;
  }
  statusEl.classList.add("connected");

  document.getElementById("btn-link").classList.add("hidden");
  document.getElementById("btn-sync").disabled = false;
  document.getElementById("btn-unlink").classList.remove("hidden");
}

function setUnlinkedState() {
  const statusEl = document.getElementById("connection-status");
  statusEl.textContent = "Not linked — click Link Project";
  statusEl.classList.remove("connected");

  document.getElementById("btn-link").classList.remove("hidden");
  document.getElementById("btn-sync").disabled = true;
  document.getElementById("btn-unlink").classList.add("hidden");
}

// ─── Link project flow ───────────────────────────────────

function linkProject() {
  document.getElementById("link-form").classList.remove("hidden");
  document.getElementById("btn-link").classList.add("hidden");
  document.getElementById("input-project-id").focus();
  updateStatus("");
}

function cancelLink() {
  document.getElementById("link-form").classList.add("hidden");
  document.getElementById("btn-link").classList.remove("hidden");
  document.getElementById("input-project-id").value = "";
  document.getElementById("input-sync-token").value = "";
}

async function confirmLink() {
  const projectId = document.getElementById("input-project-id").value.trim();
  const syncToken = document.getElementById("input-sync-token").value.trim();

  if (!projectId) {
    updateStatus("Project ID is required", "error");
    return;
  }
  if (!syncToken) {
    updateStatus("Sync Token is required", "error");
    return;
  }

  try {
    await saveCredentials(projectId, syncToken);

    document.getElementById("link-form").classList.add("hidden");
    document.getElementById("input-project-id").value = "";
    document.getElementById("input-sync-token").value = "";

    setLinkedState(projectId, new Date().toISOString());
    updateStatus("Project linked successfully", "success");
  } catch (e) {
    updateStatus("Failed to save credentials: " + e.message, "error");
  }
}

// ─── Unlink flow ─────────────────────────────────────────

async function unlinkProject() {
  try {
    await clearCredentials();
    setUnlinkedState();
    updateStatus("Project unlinked", "");
  } catch (e) {
    updateStatus("Failed to unlink: " + e.message, "error");
  }
}

// ─── Sync flow ───────────────────────────────────────────

async function syncTimeline() {
  const syncBtn = document.getElementById("btn-sync");
  syncBtn.disabled = true;
  updateStatus("Extracting timeline...");

  try {
    // Step 1: load credentials
    const credentials = await loadCredentials();
    if (!credentials) {
      throw new Error("Not linked — click Link Project first");
    }

    // Step 2: extract timeline data
    const data = extractTimelineData();
    const { totalTracks, totalClips, totalMarkers } = data.metadata;
    updateStatus(
      `Syncing ${totalClips} clips across ${totalTracks} tracks...`
    );

    // Step 3: send to backend
    await syncToBackend(
      credentials.projectId,
      credentials.syncToken,
      data
    );

    updateStatus(
      `Synced: ${totalClips} clips · ${totalMarkers} markers`,
      "success"
    );
  } catch (err) {
    updateStatus(err.message, "error");
  } finally {
    syncBtn.disabled = false;
  }
}

// ─── Shared UI helper ────────────────────────────────────

function updateStatus(message, type = "") {
  const el = document.getElementById("status-message");
  el.textContent = message;
  el.className = "status-message " + type;
}