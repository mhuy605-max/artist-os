import { ApiError } from "@/services/api/client";
import { SONG_ROLES, type Song, type SongRole } from "@/types";

export function normalizeId(id: Song["id"]) {
  return String(id);
}

export type SongAccess = {
  role: SongRole | null;
  canEdit: boolean;
  canManageMembers: boolean;
  isOwner: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canDeleteSong: boolean;
  canProvisionDrive: boolean;
  isReadOnly: boolean;
};

export const READ_ONLY_SONG_ACCESS: SongAccess = {
  role: null,
  canEdit: false,
  canManageMembers: false,
  isOwner: false,
  isEditor: false,
  isViewer: false,
  canDeleteSong: false,
  canProvisionDrive: false,
  isReadOnly: true,
};

function isSongRole(value: unknown): value is SongRole {
  return typeof value === "string" && SONG_ROLES.includes(value as SongRole);
}

export function deriveSongAccess(song: Song): SongAccess {
  const role = isSongRole(song.currentUserRole) ? song.currentUserRole : null;
  const isOwner = role === "OWNER";
  const isEditor = role === "EDITOR";
  const isViewer = role === "VIEWER";
  const canEdit = Boolean(role && song.canEdit === true);
  const canManageMembers = Boolean(role && song.canManageMembers === true);

  if (!role) return READ_ONLY_SONG_ACCESS;

  return {
    role,
    canEdit,
    canManageMembers,
    isOwner,
    isEditor,
    isViewer,
    canDeleteSong: isOwner,
    canProvisionDrive: isOwner,
    isReadOnly: !canEdit,
  };
}

export function songRoleLabel(access: SongAccess) {
  if (access.isOwner) return "Owner";
  if (access.isEditor) return "Editor";
  if (access.isViewer) return "Viewer access";
  return "View only";
}

export function audioAssetsQueryKey(songId: string) {
  return ["songs", songId, "audio-assets"];
}

export function visualAssetsQueryKey(songId: string) {
  return ["songs", songId, "visual-assets"];
}

export function releaseQueryKey(songId: string) {
  return ["songs", songId, "release"];
}

export function releaseChecklistQueryKey(songId: string) {
  return ["songs", songId, "release", "checklist"];
}

export function releaseReadinessQueryKey(songId: string) {
  return ["songs", songId, "release", "readiness"];
}

export function contentItemsQueryKey(songId: string) {
  return ["songs", songId, "content-items"];
}

export function creditsQueryKey(songId: string) {
  return ["songs", songId, "credits"];
}

export function analyticsSnapshotsQueryKey(songId: string) {
  return ["songs", songId, "analytics"];
}

export function numberOrNull(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function externalProviderLabel(provider: string) {
  return provider === "GoogleDrive" ? "Google Drive" : provider;
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return "Size not set";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

export function parseApiProblemTitle(error: ApiError) {
  try {
    const parsed = JSON.parse(error.message) as { title?: unknown; error?: unknown };
    const detail = typeof parsed.title === "string" ? parsed.title : parsed.error;
    return typeof detail === "string" ? detail : "";
  } catch {
    return "";
  }
}
