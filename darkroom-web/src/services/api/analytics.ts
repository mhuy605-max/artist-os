import { http } from "./client";
import type { AnalyticsSnapshot, AnalyticsSnapshotPayload } from "@/types";

export const analyticsApi = {
  getAnalyticsSnapshots(songId: string): Promise<AnalyticsSnapshot[]> {
    return http.get<AnalyticsSnapshot[]>(`/api/songs/${songId}/analytics`);
  },

  getAnalyticsSnapshot(songId: string, analyticsSnapshotId: string): Promise<AnalyticsSnapshot> {
    return http.get<AnalyticsSnapshot>(`/api/songs/${songId}/analytics/${analyticsSnapshotId}`);
  },

  createAnalyticsSnapshot(
    songId: string,
    payload: AnalyticsSnapshotPayload,
  ): Promise<AnalyticsSnapshot> {
    return http.post<AnalyticsSnapshot>(`/api/songs/${songId}/analytics`, payload);
  },

  async updateAnalyticsSnapshot(
    songId: string,
    analyticsSnapshotId: string,
    payload: AnalyticsSnapshotPayload,
  ): Promise<AnalyticsSnapshot> {
    await http.put<void>(`/api/songs/${songId}/analytics/${analyticsSnapshotId}`, payload);
    return await this.getAnalyticsSnapshot(songId, analyticsSnapshotId);
  },

  deleteAnalyticsSnapshot(songId: string, analyticsSnapshotId: string): Promise<void> {
    return http.delete<void>(`/api/songs/${songId}/analytics/${analyticsSnapshotId}`);
  },
};
