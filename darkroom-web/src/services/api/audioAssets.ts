import { http } from "./client";
import type { AudioAsset, AudioAssetPayload } from "@/types";

export const audioAssetsApi = {
  getAudioAssets(songId: string): Promise<AudioAsset[]> {
    return http.get<AudioAsset[]>(`/api/songs/${songId}/audio-assets`);
  },

  getAudioAsset(songId: string, audioAssetId: string): Promise<AudioAsset> {
    return http.get<AudioAsset>(`/api/songs/${songId}/audio-assets/${audioAssetId}`);
  },

  createAudioAsset(songId: string, payload: AudioAssetPayload): Promise<AudioAsset> {
    return http.post<AudioAsset>(`/api/songs/${songId}/audio-assets`, payload);
  },

  async updateAudioAsset(
    songId: string,
    audioAssetId: string,
    payload: AudioAssetPayload,
  ): Promise<AudioAsset> {
    await http.put<void>(`/api/songs/${songId}/audio-assets/${audioAssetId}`, payload);
    return await this.getAudioAsset(songId, audioAssetId);
  },

  deleteAudioAsset(songId: string, audioAssetId: string): Promise<void> {
    return http.delete<void>(`/api/songs/${songId}/audio-assets/${audioAssetId}`);
  },

  uploadAudioAssetFile(songId: string, audioAssetId: string, file: File): Promise<AudioAsset> {
    const formData = new FormData();
    formData.append("file", file);
    return http.form<AudioAsset>(
      `/api/songs/${songId}/audio-assets/${audioAssetId}/upload`,
      formData,
    );
  },
};
