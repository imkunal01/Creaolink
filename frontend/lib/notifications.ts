/**
 * notifications.ts
 * Client-side notification store. Polls existing project/chat/feedback
 * APIs and surfaces changes as in-app notifications persisted to localStorage.
 */

export type NotifKind =
  | "chat"          // new chat message
  | "feedback"      // new feedback added
  | "status"        // project status changed
  | "member"        // team member added / removed
  | "version"       // new version pushed
  | "project";      // new project created / assigned

export interface AppNotification {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  projectId?: string;
  projectTitle?: string;
  read: boolean;
  createdAt: string; // ISO
}

const STORAGE_KEY = "cl_notifications_v2";
const SEEN_MSGS_KEY = "cl_seen_msgs";
const SEEN_FB_KEY = "cl_seen_fb";
const SEEN_PROJ_KEY = "cl_seen_proj";

// ── Persistence helpers ────────────────────────────────────────────────────

function loadNotifs(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function saveNotifs(list: AppNotification[]): void {
  if (typeof window === "undefined") return;
  // Keep only the most recent 60
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 60)));
}

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify([...set].slice(-500)));
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Public API ─────────────────────────────────────────────────────────────

export function getNotifications(): AppNotification[] {
  return loadNotifs();
}

export function getUnreadCount(): number {
  return loadNotifs().filter((n) => !n.read).length;
}

export function markAllRead(): void {
  const list = loadNotifs().map((n) => ({ ...n, read: true }));
  saveNotifs(list);
}

export function markRead(id: string): void {
  const list = loadNotifs().map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifs(list);
}

export function clearAll(): void {
  saveNotifs([]);
}

export function deleteNotification(id: string): void {
  saveNotifs(loadNotifs().filter((n) => n.id !== id));
}

function pushNotif(notif: Omit<AppNotification, "id" | "createdAt" | "read">) {
  const list = loadNotifs();
  list.unshift({
    ...notif,
    id: makeId(),
    read: false,
    createdAt: new Date().toISOString(),
  });
  saveNotifs(list);
  // Dispatch a storage event so open tabs pick it up
  window.dispatchEvent(new Event("cl_notif_update"));
}

// ── Polling Logic ─────────────────────────────────────────────────────────

async function checkChat(userId: string, projectId: string, projectTitle: string) {
  try {
    const res = await fetch(`/api/projects/${projectId}/chat`, {
      headers: { "x-user-id": userId },
    });
    if (!res.ok) return;
    const data = await res.json();
    const messages: Array<{ id: string; sender_id: string; sender_name: string; body: string }> =
      data.messages || [];

    const seen = loadSet(SEEN_MSGS_KEY);
    let hasNew = false;

    for (const msg of messages) {
      if (!seen.has(msg.id) && msg.sender_id !== userId) {
        seen.add(msg.id);
        hasNew = true;
        pushNotif({
          kind: "chat",
          title: `💬 New message in "${projectTitle}"`,
          body: msg.sender_name
            ? `${msg.sender_name}: ${msg.body?.slice(0, 80) || "(attachment)"}`
            : msg.body?.slice(0, 80) || "(attachment)",
          projectId,
          projectTitle,
        });
      } else {
        seen.add(msg.id); // mark own messages seen too so they don't fire later
      }
    }

    if (hasNew) saveSet(SEEN_MSGS_KEY, seen);
  } catch {
    // ignore
  }
}

async function checkFeedback(userId: string, projectId: string, projectTitle: string) {
  try {
    const res = await fetch(`/api/projects/${projectId}/feedback`, {
      headers: { "x-user-id": userId },
    });
    if (!res.ok) return;
    const data = await res.json();
    const items: Array<{ id: string; type: string; priority: string; creator_name: string; description: string }> =
      data.feedback || [];

    const seen = loadSet(SEEN_FB_KEY);
    let hasNew = false;

    for (const fb of items) {
      if (!seen.has(fb.id)) {
        seen.add(fb.id);
        hasNew = true;
        pushNotif({
          kind: "feedback",
          title: `📝 New feedback on "${projectTitle}"`,
          body: `${fb.creator_name || "Someone"} added ${fb.priority} priority ${fb.type}: ${fb.description?.slice(0, 60) || ""}`,
          projectId,
          projectTitle,
        });
      }
    }

    if (hasNew) saveSet(SEEN_FB_KEY, seen);
  } catch {
    // ignore
  }
}

async function checkProjects(userId: string) {
  try {
    const res = await fetch("/api/projects", {
      headers: { "x-user-id": userId },
    });
    if (!res.ok) return;
    const data = await res.json();
    const projects: Array<{ id: string; title: string; status: string; updated_at?: string }> =
      data.projects || [];

    const seen = loadSet(SEEN_PROJ_KEY);
    let hasNew = false;

    for (const proj of projects) {
      const key = `${proj.id}:${proj.status}`;
      if (!seen.has(proj.id)) {
        // Brand new project we haven't seen
        seen.add(proj.id);
        seen.add(key);
        hasNew = true;
        pushNotif({
          kind: "project",
          title: `🗂️ Project assigned: "${proj.title}"`,
          body: `You have been added to a new project. Status: ${proj.status}.`,
          projectId: proj.id,
          projectTitle: proj.title,
        });
      } else if (!seen.has(key)) {
        // Status changed
        seen.add(key);
        hasNew = true;
        pushNotif({
          kind: "status",
          title: `🔄 Status updated: "${proj.title}"`,
          body: `Project status changed to "${proj.status}".`,
          projectId: proj.id,
          projectTitle: proj.title,
        });
      }
    }

    if (hasNew) saveSet(SEEN_PROJ_KEY, seen);
    return projects;
  } catch {
    return [];
  }
}

// ── Polling Orchestrator ──────────────────────────────────────────────────

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastProjects: Array<{ id: string; title: string; status: string }> = [];

export function startNotificationPolling(userId: string) {
  if (_intervalId) return; // Already running

  const poll = async () => {
    const projects = (await checkProjects(userId)) as Array<{ id: string; title: string; status: string }> | undefined;
    if (projects && projects.length > 0) {
      _lastProjects = projects;
    }

    // Check chat + feedback for each project (limit to 5 to avoid hammering)
    const targets = _lastProjects.slice(0, 5);
    for (const proj of targets) {
      await checkChat(userId, proj.id, proj.title);
      await checkFeedback(userId, proj.id, proj.title);
    }
  };

  // First run after 3 seconds (let the page settle)
  setTimeout(poll, 3000);
  _intervalId = setInterval(poll, 30_000); // every 30 seconds
}

export function stopNotificationPolling() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}
