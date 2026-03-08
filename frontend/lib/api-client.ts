/**
 * Client-side API fetch wrapper
 * Provides a fetch wrapper with automatic header injection
 */

export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
