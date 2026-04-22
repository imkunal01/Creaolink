/**
 * Client-side API fetch wrapper
 * Uses same-origin cookies for authenticated requests.
 */

export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const headers: HeadersInit = {
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers || {}),
  };

  return fetch(url, {
    ...options,
    credentials: "same-origin",
    headers,
  });
}
