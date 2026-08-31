import { ApiError, http } from "./client";
import { clearAccessToken, getAccessToken, setAccessToken } from "./authToken";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "@/types";

export const authQueryKey = ["auth", "me"] as const;

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const response = await http.post<AuthResponse>("/api/auth/register", payload);
    setAccessToken(response.accessToken);
    return response.user;
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    const response = await http.post<AuthResponse>("/api/auth/login", payload);
    setAccessToken(response.accessToken);
    return response.user;
  },

  async logout(): Promise<void> {
    try {
      await http.post<void>("/api/auth/logout", {});
    } finally {
      clearAccessToken();
    }
  },

  me(): Promise<AuthUser> {
    if (!getAccessToken()) {
      return Promise.reject(new ApiError("Unauthorized", 401));
    }

    return http.get<AuthUser>("/api/auth/me");
  },
};
