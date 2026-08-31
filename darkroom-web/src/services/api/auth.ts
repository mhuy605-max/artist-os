import { http } from "./client";
import type { AuthUser, LoginPayload, RegisterPayload } from "@/types";

export const authQueryKey = ["auth", "me"] as const;

export const authApi = {
  register(payload: RegisterPayload): Promise<AuthUser> {
    return http.post<AuthUser>("/api/auth/register", payload);
  },

  login(payload: LoginPayload): Promise<AuthUser> {
    return http.post<AuthUser>("/api/auth/login", payload);
  },

  logout(): Promise<void> {
    return http.post<void>("/api/auth/logout", {});
  },

  me(): Promise<AuthUser> {
    return http.get<AuthUser>("/api/auth/me");
  },
};
