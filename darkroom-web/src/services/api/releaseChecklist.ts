import { ApiError, http } from "./client";
import type { ReleaseChecklistItem, ReleaseChecklistItemPayload } from "@/types";

export const releaseChecklistApi = {
  getChecklist(songId: string): Promise<ReleaseChecklistItem[]> {
    return http.get<ReleaseChecklistItem[]>(`/api/songs/${songId}/release/checklist`);
  },

  getChecklistItem(songId: string, checklistItemId: string): Promise<ReleaseChecklistItem> {
    return http.get<ReleaseChecklistItem>(
      `/api/songs/${songId}/release/checklist/${checklistItemId}`,
    );
  },

  async updateChecklistItem(
    songId: string,
    checklistItemId: string,
    payload: ReleaseChecklistItemPayload,
  ): Promise<ReleaseChecklistItem> {
    await http.put<void>(`/api/songs/${songId}/release/checklist/${checklistItemId}`, payload);
    const item = await this.getChecklistItem(songId, checklistItemId);
    if (!item) {
      throw new ApiError("Release checklist item was not found after update.", 404);
    }
    return item;
  },
};
