import { getUser } from "./auth";

/**
 * Authenticated fetch — automatically injects user headers from localStorage.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const user = getUser();
  const headers = new Headers(options.headers);

  if (user) {
    headers.set("x-user-id", user.id);
    headers.set("x-user-name", user.name);
    headers.set("x-user-email", user.email);
    headers.set("x-user-role", user.role);
  }

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}
