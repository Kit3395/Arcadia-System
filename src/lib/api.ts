/**
 * ARCADIA SYSTEM - Authenticated API client helper.
 * Injects the session Bearer token (stored at login) into every request so the
 * server can identify the caller without relying on ambient global state.
 */

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('arcadia_session_token') : null;
  if (!token) return extra ?? {};
  const headers = new Headers(extra);
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: authHeaders(init.headers),
  });
}
