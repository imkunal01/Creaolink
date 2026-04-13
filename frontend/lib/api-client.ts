/**
 * Client-side API fetch wrapper
 * Provides a fetch wrapper with automatic header injection
 */

import { getUser } from "@/lib/auth";

export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const user = getUser();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(user?.id ? { "x-user-id": user.id } : {}),
    ...(options?.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
