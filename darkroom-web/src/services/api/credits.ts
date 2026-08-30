import { http } from "./client";
import type { Credit, CreditPayload } from "@/types";

export const creditsApi = {
  getCredits(songId: string): Promise<Credit[]> {
    return http.get<Credit[]>(`/api/songs/${songId}/credits`);
  },

  getCredit(songId: string, creditId: string): Promise<Credit> {
    return http.get<Credit>(`/api/songs/${songId}/credits/${creditId}`);
  },

  createCredit(songId: string, payload: CreditPayload): Promise<Credit> {
    return http.post<Credit>(`/api/songs/${songId}/credits`, payload);
  },

  async updateCredit(songId: string, creditId: string, payload: CreditPayload): Promise<Credit> {
    await http.put<void>(`/api/songs/${songId}/credits/${creditId}`, payload);
    return await this.getCredit(songId, creditId);
  },

  deleteCredit(songId: string, creditId: string): Promise<void> {
    return http.delete<void>(`/api/songs/${songId}/credits/${creditId}`);
  },
};
