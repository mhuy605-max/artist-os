import type { ReleaseInfo } from "@/types";
import { mockSongs } from "./songs";
import { getSongMeta } from "./songs";

/** MOCK release records. No release backend exists yet. */
const STAGES: ReleaseInfo["stage"][] = [
  "Preparing",
  "Ready",
  "Scheduled",
  "Released",
  "Planning",
  "Scheduled",
  "Planning",
  "Planning",
];

const CHECKLIST_DONE: number[] = [3, 5, 6, 7, 0, 5, 0, 1];

const CHECKLIST_ITEMS = [
  "Master",
  "Cover",
  "Metadata",
  "Credits",
  "Canvas",
  "Music Video",
  "Content Plan",
];

export function getRelease(songId: string): ReleaseInfo {
  const index = mockSongs.findIndex((s) => s.id === songId);
  const meta = getSongMeta(songId);
  const doneCount = index >= 0 ? CHECKLIST_DONE[index] ?? 0 : 0;

  return {
    songId,
    releaseDate: meta.releaseDate ?? "Not scheduled",
    distributor: index >= 0 ? "DISTROKID" : "—",
    isrc: index >= 0 ? `QZ-K4S-26-00${index + 1}` : "—",
    upc: index >= 0 ? `19122${(700000 + index * 37).toString()}` : "—",
    releaseType: "Single",
    platforms: ["Spotify", "Apple Music", "YouTube Music", "Tidal", "Deezer"],
    stage: (index >= 0 ? STAGES[index] : "Planning") ?? "Planning",
    checklist: CHECKLIST_ITEMS.map((item, i) => ({ item, done: i < doneCount })),
  };
}
