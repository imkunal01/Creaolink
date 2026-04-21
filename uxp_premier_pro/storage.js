const { storage } = require("uxp");

const CREDENTIALS_FILENAME = "creaolink-credentials.json";

// ─── Low-level file helpers ──────────────────────────────

async function getCredentialsFile(mode) {
  const dataFolder = await storage.localFileSystem.getDataFolder();

  if (mode === "read") {
    try {
      const file = await dataFolder.getEntry(CREDENTIALS_FILENAME);
      return file;
    } catch (e) {
      // File doesn't exist yet — return null instead of throwing
      return null;
    }
  }

  if (mode === "write") {
    // createFile with overwrite:true replaces existing file
    return await dataFolder.createFile(CREDENTIALS_FILENAME, {
      overwrite: true
    });
  }
}

// ─── Public API ──────────────────────────────────────────

async function saveCredentials(projectId, currentVersionId, projectName) {
  if (!projectId || !currentVersionId) {
    throw new Error("Both projectId and currentVersionId are required");
  }

  const credentials = {
    projectId: projectId.trim(),
    currentVersionId: currentVersionId.trim(),
    projectName: projectName ? projectName.trim() : "Unknown Project",
    linkedAt: new Date().toISOString()
  };

  const file = await getCredentialsFile("write");
  await file.write(JSON.stringify(credentials, null, 2));
}

async function loadCredentials() {
  const file = await getCredentialsFile("read");

  if (!file) return null;      // not linked yet — this is normal

  try {
    const raw = await file.read({ format: storage.formats.utf8 });
    const credentials = JSON.parse(raw);

    // Validate the stored data has what we need
    if (!credentials.projectId || !credentials.currentVersionId) {
      return null;
    }

    return {
      projectId: credentials.projectId,
      currentVersionId: credentials.currentVersionId,
      projectName: credentials.projectName || "Unknown Project",
      linkedAt: credentials.linkedAt || null
    };
  } catch (e) {
    // File exists but is corrupt — treat as not linked
    console.error("Failed to parse credentials file:", e.message);
    return null;
  }
}

async function clearCredentials() {
  const file = await getCredentialsFile("read");
  if (!file) return;           // nothing to clear

  try {
    await file.delete();
  } catch (e) {
    console.error("Failed to clear credentials:", e.message);
  }
}

async function isLinked() {
  const credentials = await loadCredentials();
  return credentials !== null;
}

module.exports = {
  saveCredentials,
  loadCredentials,
  clearCredentials,
  isLinked
};