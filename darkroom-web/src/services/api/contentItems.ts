import { http } from "./client";
import type { ContentItem, ContentItemPayload } from "@/types";

export const contentItemsApi = {
  getContentItems(songId: string): Promise<ContentItem[]> {
    return http.get<ContentItem[]>(`/api/songs/${songId}/content-items`);
  },

  getContentItem(songId: string, contentItemId: string): Promise<ContentItem> {
    return http.get<ContentItem>(`/api/songs/${songId}/content-items/${contentItemId}`);
  },

  createContentItem(songId: string, payload: ContentItemPayload): Promise<ContentItem> {
    return http.post<ContentItem>(`/api/songs/${songId}/content-items`, payload);
  },

  async updateContentItem(
    songId: string,
    contentItemId: string,
    payload: ContentItemPayload,
  ): Promise<ContentItem> {
    await http.put<void>(`/api/songs/${songId}/content-items/${contentItemId}`, payload);
    return await this.getContentItem(songId, contentItemId);
  },

  deleteContentItem(songId: string, contentItemId: string): Promise<void> {
    return http.delete<void>(`/api/songs/${songId}/content-items/${contentItemId}`);
  },
};
