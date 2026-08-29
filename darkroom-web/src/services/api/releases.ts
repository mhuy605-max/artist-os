import { ApiError, http } from "./client";
import type { Release, ReleasePayload } from "@/types";

export const releasesApi = {
  async getRelease(songId: string): Promise<Release | null> {
    try {
      return await http.get<Release>(`/api/songs/${songId}/release`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  createRelease(songId: string, payload: ReleasePayload): Promise<Release> {
    return http.post<Release>(`/api/songs/${songId}/release`, payload);
  },

  async updateRelease(songId: string, payload: ReleasePayload): Promise<Release> {
    await http.put<void>(`/api/songs/${songId}/release`, payload);
    const release = await this.getRelease(songId);
    if (!release) {
      throw new ApiError("Release plan was not found after update.", 404);
    }
    return release;
  },

  deleteRelease(songId: string): Promise<void> {
    return http.delete<void>(`/api/songs/${songId}/release`);
  },
};
