import { http } from "./client";
import type { VisualAsset, VisualAssetPayload } from "@/types";

export const visualAssetsApi = {
  getVisualAssets(songId: string): Promise<VisualAsset[]> {
    return http.get<VisualAsset[]>(`/api/songs/${songId}/visual-assets`);
  },

  getVisualAsset(songId: string, visualAssetId: string): Promise<VisualAsset> {
    return http.get<VisualAsset>(`/api/songs/${songId}/visual-assets/${visualAssetId}`);
  },

  createVisualAsset(songId: string, payload: VisualAssetPayload): Promise<VisualAsset> {
    return http.post<VisualAsset>(`/api/songs/${songId}/visual-assets`, payload);
  },

  async updateVisualAsset(
    songId: string,
    visualAssetId: string,
    payload: VisualAssetPayload,
  ): Promise<VisualAsset> {
    await http.put<void>(`/api/songs/${songId}/visual-assets/${visualAssetId}`, payload);
    return await this.getVisualAsset(songId, visualAssetId);
  },

  deleteVisualAsset(songId: string, visualAssetId: string): Promise<void> {
    return http.delete<void>(`/api/songs/${songId}/visual-assets/${visualAssetId}`);
  },
};
