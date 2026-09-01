import { ApiError, http } from "./client";
import type { DriveWorkspace } from "@/types";

export class DriveWorkspaceDisconnectedError extends Error {
  constructor(message = "Google Drive is not connected.") {
    super(message);
    this.name = "DriveWorkspaceDisconnectedError";
  }
}

export function isDriveWorkspaceDisconnectedError(
  error: unknown,
): error is DriveWorkspaceDisconnectedError {
  return error instanceof DriveWorkspaceDisconnectedError;
}

function isDisconnectedDriveWorkspaceConflict(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    error.message.includes("Google Drive is not connected")
  );
}

export function driveWorkspaceQueryKey(songId: string) {
  return ["songs", songId, "drive-workspace"];
}

export const driveWorkspaceApi = {
  async getWorkspace(songId: string) {
    try {
      return await http.get<DriveWorkspace>(`/api/songs/${songId}/drive-workspace`);
    } catch (error) {
      if (isDisconnectedDriveWorkspaceConflict(error)) {
        throw new DriveWorkspaceDisconnectedError();
      }
      throw error;
    }
  },
  provisionWorkspace: (songId: string) =>
    http.post<DriveWorkspace>(`/api/songs/${songId}/drive-workspace/provision`, {}),
};
