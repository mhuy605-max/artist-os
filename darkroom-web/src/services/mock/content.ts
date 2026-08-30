import type { MockContentItem, MockContentStage } from "@/types";
import { mockSongs } from "./songs";

/** MOCK content campaign items. */
export const MOCK_CONTENT_STAGES: MockContentStage[] = [
  "Idea",
  "Planned",
  "In Production",
  "Editing",
  "Ready",
  "Scheduled",
  "Published",
];

const TEMPLATE: Omit<MockContentItem, "id" | "songId">[] = [
  {
    title: "Teaser 01 — hook loop",
    type: "Teaser",
    stage: "Scheduled",
    owner: "AR",
    scheduledFor: "2026-09-01",
    platform: "Instagram",
  },
  {
    title: "Snippet — second verse",
    type: "Snippet",
    stage: "Editing",
    owner: "AR",
    scheduledFor: "2026-09-04",
    platform: "TikTok",
  },
  {
    title: "Music video premiere",
    type: "Music Video",
    stage: "In Production",
    owner: "MG",
    scheduledFor: "2026-09-18",
    platform: "YouTube",
  },
  {
    title: "Visualizer upload",
    type: "Visualizer",
    stage: "Ready",
    owner: "JD",
    scheduledFor: "2026-09-06",
    platform: "YouTube",
  },
  {
    title: "Studio BTS cut",
    type: "Behind The Scenes",
    stage: "Planned",
    owner: "KM",
    platform: "YouTube",
  },
  {
    title: "Dance trend seed",
    type: "TikTok",
    stage: "Idea",
    owner: "AR",
    platform: "TikTok",
  },
  {
    title: "Reel — cover reveal",
    type: "Instagram Reel",
    stage: "Published",
    owner: "AR",
    scheduledFor: "2026-08-24",
    platform: "Instagram",
  },
  {
    title: "Short — chorus vertical",
    type: "YouTube Short",
    stage: "Scheduled",
    owner: "JD",
    scheduledFor: "2026-09-08",
    platform: "YouTube",
  },
  {
    title: "Artwork announcement",
    type: "Artwork Post",
    stage: "Published",
    owner: "JD",
    scheduledFor: "2026-08-20",
    platform: "Instagram",
  },
];

export function getMockContentItems(songId: string): MockContentItem[] {
  const index = mockSongs.findIndex((s) => s.id === songId);
  if (index < 0) return [];
  const depth = [6, 7, 9, 9, 0, 4, 0, 1][index] ?? 0;
  return TEMPLATE.slice(0, depth).map((item, i) => ({
    ...item,
    id: `${songId}-content-${i}`,
    songId,
  }));
}
