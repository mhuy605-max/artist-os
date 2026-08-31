/**
 * Thin HTTP client for the real DARKROOM backend
 * (ASP.NET Core Web API / .NET 10 / EF Core / PostgreSQL).
 *
 * Base URL is configurable via VITE_API_BASE_URL.
 */
import { clearAccessToken, getAccessToken } from "./authToken";

export const API_BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "http://localhost:5178";

export const unauthorizedEventName = "artist-os:unauthorized";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** True when the API host could not be reached at all (offline / not running). */
export class ApiUnreachableError extends Error {
  constructor(message = "API unreachable") {
    super(message);
    this.name = "ApiUnreachableError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const accessToken = getAccessToken();
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiUnreachableError();
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      clearAccessToken();
      window.dispatchEvent(new Event(unauthorizedEventName));
    }

    const text = await response.text().catch(() => "");
    throw new ApiError(text || `Request failed (${response.status})`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
