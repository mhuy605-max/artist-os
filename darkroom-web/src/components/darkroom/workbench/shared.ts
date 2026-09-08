import { ApiError } from "@/services/api/client";
import type { Song } from "@/types";

export function normalizeId(id: Song["id"]) {
  return String(id);
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
