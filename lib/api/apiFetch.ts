import { createClient } from "@/lib/supabase/client";

/**
 * Drop-in replacement for fetch() that adds Authorization: Bearer token.
 * Usage: apiFetch("/api/hockey/players", { method: "POST", body: JSON.stringify(data) })
 */
export async function apiFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const sb = createClient();
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...init, headers });
}
