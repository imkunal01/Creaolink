export type UserRole = "client" | "freelancer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
}

const STORAGE_KEY = "creaolink_user";
const AUTH_EVENT = "creaolink-auth-change";

function emitAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function writeSnapshot(user: User | null) {
  if (typeof window === "undefined") return;

  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }

  emitAuthChange();
}

export function setUser(user: User): void {
  writeSnapshot(user);
}

export function clearUser(): void {
  writeSnapshot(null);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getUserRole(): UserRole | null {
  return getUser()?.role ?? null;
}

export function isAuthenticated(): boolean {
  return getUser() !== null;
}

export async function syncUserFromSession(): Promise<User | null> {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch("/api/auth/me", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      method: "GET",
    });

    if (!response.ok) {
      clearUser();
      return null;
    }

    const data = (await response.json()) as { user?: User | null };
    if (!data.user) {
      clearUser();
      return null;
    }

    setUser(data.user);
    return data.user;
  } catch {
    return getUser();
  }
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      await fetch("/api/auth/logout", {
        credentials: "same-origin",
        method: "POST",
      });
    } catch {
      // Ignore network failures and clear the local snapshot either way.
    }
  }

  clearUser();
}

export function subscribeToAuthChanges(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => listener();

  window.addEventListener("storage", handleChange);
  window.addEventListener("focus", handleChange);
  window.addEventListener(AUTH_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("focus", handleChange);
    window.removeEventListener(AUTH_EVENT, handleChange);
  };
}
