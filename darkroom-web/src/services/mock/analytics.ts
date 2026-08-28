import type { AnalyticsSnapshot } from "@/types";
import { mockSongs } from "./songs";

/** MOCK analytics. No YouTube integration exists yet. */
const TEMPLATE: Omit<AnalyticsSnapshot, "songId">[] = [
  {
    views: 1_842_119,
    likes: 96_420,
    comments: 5_311,
    watchTimeHours: 74_210,
    subscriberGrowth: 8_940,
    velocity: [
      { label: "W1", value: 420 },
      { label: "W2", value: 610 },
      { label: "W3", value: 780 },
      { label: "W4", value: 690 },
      { label: "W5", value: 520 },
      { label: "W6", value: 610 },
      { label: "W7", value: 840 },
      { label: "W8", value: 910 },
    ],
    topContent: [
      { title: "Visualizer — full cut", platform: "YouTube", views: 612_400 },
      { title: "Snippet — second verse", platform: "TikTok", views: 388_120 },
      { title: "Reel — cover reveal", platform: "Instagram", views: 204_770 },
      { title: "Short — chorus vertical", platform: "YouTube", views: 141_902 },
    ],
  },
];

export function getAnalytics(songId: string): AnalyticsSnapshot | null {
  const song = mockSongs.find((s) => s.id === songId);
  if (!song) return null;
  if (song.status !== "Released" && song.status !== "Analytics") return null;
  return { songId, ...TEMPLATE[0]! };
}

export const workspacePerformance = {
  totalViews: 4_119_804,
  growth30d: 18.4,
  topRelease: "GHOST FREQUENCY",
  topReleaseViews: 1_842_119,
  contentPosts: 46,
  avgContentViews: 82_400,
  monthly: [
    { label: "MAR", value: 310 },
    { label: "APR", value: 480 },
    { label: "MAY", value: 520 },
    { label: "JUN", value: 610 },
    { label: "JUL", value: 740 },
    { label: "AUG", value: 880 },
  ],
};
