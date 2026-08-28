import { http, ApiUnreachableError } from "./client";
import { mockSongs } from "../mock/songs";
import type { Song, SongPayload } from "@/types";

/**
 * Songs API — this area is backed by the REAL backend:
 *   GET/POST/PUT/DELETE /api/songs
 *
 * While the .NET API is not reachable from this environment, the layer falls
 * back to an in-memory mock store so the product remains navigable. The fallback
 * is isolated here; UI never talks to fetch or to mocks directly.
 */

let fallbackStore: Song[] | null = null;
let usingFallback = false;

export function isUsingFallbackData() {
  return usingFallback;
}

function fallback(): Song[] {
  usingFallback = true;
  if (!fallbackStore) fallbackStore = mockSongs.map((s) => ({ ...s }));
  return fallbackStore;
}

export const songsApi = {
  async getSongs(): Promise<Song[]> {
    try {
      const songs = await http.get<Song[]>("/api/songs");
      usingFallback = false;
      return songs;
    } catch (error) {
      if (error instanceof ApiUnreachableError) return fallback();
      throw error;
    }
  },

  async getSong(id: string): Promise<Song> {
    try {
      const song = await http.get<Song>(`/api/songs/${id}`);
      usingFallback = false;
      return song;
    } catch (error) {
      if (error instanceof ApiUnreachableError) {
        const found = fallback().find((s) => String(s.id) === id);
        if (!found) throw new Error("Song not found");
        return found;
      }
      throw error;
    }
  },

  async createSong(payload: SongPayload): Promise<Song> {
    try {
      const song = await http.post<Song>("/api/songs", payload);
      usingFallback = false;
      return song;
    } catch (error) {
      if (error instanceof ApiUnreachableError) {
        const created: Song = {
          id: crypto.randomUUID(),
          title: payload.title,
          status: payload.status,
          createdAt: new Date().toISOString(),
        };
        fallback().unshift(created);
        return created;
      }
      throw error;
    }
  },

  async updateSong(id: string, payload: SongPayload): Promise<Song> {
    try {
      await http.put<void>(`/api/songs/${id}`, payload);
      usingFallback = false;
      return await this.getSong(id);
    } catch (error) {
      if (error instanceof ApiUnreachableError) {
        const store = fallback();
        const index = store.findIndex((s) => String(s.id) === id);
        if (index < 0) throw new Error("Song not found");
        const existing = store[index]!;
        const next: Song = { ...existing, title: payload.title, status: payload.status };
        store[index] = next;
        return next;
      }
      throw error;
    }
  },

  async deleteSong(id: string): Promise<void> {
    try {
      await http.delete<void>(`/api/songs/${id}`);
      usingFallback = false;
    } catch (error) {
      if (error instanceof ApiUnreachableError) {
        const store = fallback();
        const index = store.findIndex((s) => String(s.id) === id);
        if (index >= 0) store.splice(index, 1);
        return;
      }
      throw error;
    }
  },
};
