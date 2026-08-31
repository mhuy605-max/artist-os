import { http } from "./client";
import type { DriveWorkspace } from "@/types";

export function driveWorkspaceQueryKey(songId: string) {
  return ["songs", songId, "drive-workspace"];
}

export const driveWorkspaceApi = {
  getWorkspace: (songId: string) =>
    http.get<DriveWorkspace>(`/api/songs/${songId}/drive-workspace`),
  provisionWorkspace: (songId: string) =>
    http.post<DriveWorkspace>(`/api/songs/${songId}/drive-workspace/provision`, {}),
};
