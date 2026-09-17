import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "./auth";
import { clearAccessToken, getAccessToken, setAccessToken } from "./authToken";
import { http, resolveApiBaseUrl, unauthorizedEventName } from "./client";

describe("JWT auth API client", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("login stores the access token and returns the safe user", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: "jwt-login-token",
          tokenType: "Bearer",
          expiresAt: "2026-08-31T12:00:00Z",
          user: {
            id: 1,
            email: "artist@example.com",
            displayName: "Artist",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const user = await authApi.login({
      email: "artist@example.com",
      password: "password123",
    });

    expect(user).toEqual({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });
    expect(getAccessToken()).toBe("jwt-login-token");
  });

  it("shared requests send the Bearer token when one is stored", async () => {
    const expectedBaseUrl = resolveApiBaseUrl(import.meta.env);
    setAccessToken("jwt-stored-token");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await http.get("/api/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      `${expectedBaseUrl}/api/auth/me`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-stored-token",
        }),
      }),
    );
  });

  it("uses the local API fallback only during development", () => {
    expect(resolveApiBaseUrl({ DEV: true })).toBe("http://localhost:5178");
  });

  it("uses the configured API base URL outside development", () => {
    expect(
      resolveApiBaseUrl({
        DEV: false,
        VITE_API_BASE_URL: "https://darkroom-stg-api.example.test",
      }),
    ).toBe("https://darkroom-stg-api.example.test");
  });

  it("normalizes trailing slashes from the configured API base URL", () => {
    expect(
      resolveApiBaseUrl({
        DEV: false,
        VITE_API_BASE_URL: "https://darkroom-stg-api.example.test/",
      }),
    ).toBe("https://darkroom-stg-api.example.test");
  });

  it("fails clearly outside development when the API base URL is missing", () => {
    expect(() => resolveApiBaseUrl({ DEV: false })).toThrow(
      "VITE_API_BASE_URL must be configured outside development.",
    );
  });

  it("fails clearly outside development when the API base URL is blank", () => {
    expect(() => resolveApiBaseUrl({ DEV: false, VITE_API_BASE_URL: "   " })).toThrow(
      "VITE_API_BASE_URL must be configured outside development.",
    );
  });

  it("does not fall back to localhost outside development", () => {
    expect(() => resolveApiBaseUrl({ DEV: false })).toThrow();
  });

  it("stored token plus successful me restores the safe user", async () => {
    setAccessToken("jwt-session-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1, email: "artist@example.com", displayName: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(authApi.me()).resolves.toEqual({
      id: 1,
      email: "artist@example.com",
      displayName: null,
    });
  });

  it("missing token does not restore a session", async () => {
    await expect(authApi.me()).rejects.toMatchObject({ status: 401 });
  });

  it("401 responses clear the token and emit the unauthorized event", async () => {
    setAccessToken("expired-token");
    const unauthorized = vi.fn();
    window.addEventListener(unauthorizedEventName, unauthorized);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 401 }));

    await expect(http.get("/api/auth/me")).rejects.toMatchObject({ status: 401 });

    expect(getAccessToken()).toBeNull();
    expect(unauthorized).toHaveBeenCalledTimes(1);
    window.removeEventListener(unauthorizedEventName, unauthorized);
  });

  it("403 responses do not clear auth state or emit unauthorized events", async () => {
    setAccessToken("valid-editor-token");
    const unauthorized = vi.fn();
    window.addEventListener(unauthorizedEventName, unauthorized);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("Forbidden", { status: 403 }));

    await expect(http.post("/api/songs/1/drive-workspace/provision", {})).rejects.toMatchObject({
      status: 403,
    });

    expect(getAccessToken()).toBe("valid-editor-token");
    expect(unauthorized).not.toHaveBeenCalled();
    window.removeEventListener(unauthorizedEventName, unauthorized);
  });

  it("logout clears the frontend token", async () => {
    setAccessToken("jwt-logout-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 204 }));

    await authApi.logout();

    expect(getAccessToken()).toBeNull();
  });

  it("token helpers clear sessionStorage state", () => {
    setAccessToken("jwt-token");
    clearAccessToken();

    expect(getAccessToken()).toBeNull();
  });
});
