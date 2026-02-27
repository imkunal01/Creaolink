// Mock auth utilities — will be replaced with real JWT logic in Phase 1C

export type UserRole = "client" | "freelancer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = "creolink_user";

/**
 * Mock: Save user to localStorage after login/signup
 */
export function setUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/**
 * Get current user from localStorage
 * In Phase 1C, this will decode a JWT from cookies instead
 */
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

/**
 * Get the current user's role
 */
export function getUserRole(): UserRole | null {
  const user = getUser();
  return user?.role ?? null;
}

/**
 * Check if a user is authenticated
 */
export function isAuthenticated(): boolean {
  return getUser() !== null;
}

/**
 * Logout: clear stored user
 */
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Mock login — sets a fake user for development
 * Remove this when real auth is wired
 */
export function mockLogin(role: UserRole = "client", name: string = "Kunal"): void {
  setUser({
    id: `mock-${role}-${Date.now()}`,
    name,
    email: `${name.toLowerCase()}@creolink.dev`,
    role,
  });
}
