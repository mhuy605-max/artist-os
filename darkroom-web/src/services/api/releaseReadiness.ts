import { http } from "./client";
import type { ReleaseReadiness } from "@/types";

export const releaseReadinessApi = {
  getReadiness(songId: string): Promise<ReleaseReadiness> {
    return http.get<ReleaseReadiness>(`/api/songs/${songId}/release/readiness`);
  },
};
