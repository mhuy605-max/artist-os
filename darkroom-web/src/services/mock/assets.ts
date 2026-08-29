import type { MockAudioAsset, MockVisualAsset, AudioAssetType, VisualCategory } from "@/types";
import { mockSongs } from "./songs";

/** MOCK audio assets. Real files will later come from Google Drive. */
const AUDIO_TEMPLATE: Omit<MockAudioAsset, "id" | "songId">[] = [
  {
    stage: "Demo",
    filename: "demo_voicememo_01.wav",
    version: "v1",
    uploadedAt: "2026-05-05T10:20:00Z",
    uploader: "VESSEL",
    status: "Approved",
    sizeMb: 42.1,
    duration: "3:12",
    current: true,
    note: "Original phone memo. Keep for reference.",
  },
  {
    stage: "Recording",
    filename: "vox_comp_lane_04.wav",
    version: "v3",
    uploadedAt: "2026-06-02T15:48:00Z",
    uploader: "AR",
    status: "Approved",
    sizeMb: 188.4,
    duration: "3:20",
    current: true,
  },
  {
    stage: "Recording",
    filename: "vox_comp_lane_02.wav",
    version: "v2",
    uploadedAt: "2026-05-28T12:10:00Z",
    uploader: "AR",
    status: "Draft",
    sizeMb: 176.9,
    duration: "3:20",
    current: false,
  },
  {
    stage: "Mix",
    filename: "mix_v7.wav",
    version: "v7",
    uploadedAt: "2026-08-26T17:10:00Z",
    uploader: "KM",
    status: "Current",
    sizeMb: 61.7,
    duration: "3:18",
    current: true,
    note: "Vocal up 0.8dB, sub tightened.",
  },
  {
    stage: "Mix",
    filename: "mix_v6.wav",
    version: "v6",
    uploadedAt: "2026-08-21T09:32:00Z",
    uploader: "KM",
    status: "Review",
    sizeMb: 61.2,
    duration: "3:18",
    current: false,
  },
  {
    stage: "Mix",
    filename: "mix_v5.wav",
    version: "v5",
    uploadedAt: "2026-08-12T19:02:00Z",
    uploader: "KM",
    status: "Draft",
    sizeMb: 60.8,
    duration: "3:19",
    current: false,
  },
  {
    stage: "Master",
    filename: "master_-9LUFS_v2.wav",
    version: "v2",
    uploadedAt: "2026-08-27T08:00:00Z",
    uploader: "TL",
    status: "Review",
    sizeMb: 63.9,
    duration: "3:18",
    current: true,
    note: "Awaiting artist approval before distribution upload.",
  },
];

export const AUDIO_STAGES: AudioAssetType[] = ["Demo", "Recording", "Mix", "Master"];

export function getAudioAssets(songId: string): MockAudioAsset[] {
  const index = mockSongs.findIndex((s) => s.id === songId);
  if (index < 0) return [];
  // Earlier lifecycle songs simply have fewer assets.
  const depth = [7, 7, 7, 7, 1, 7, 0, 3][index] ?? 0;
  return AUDIO_TEMPLATE.slice(0, depth).map((asset, i) => ({
    ...asset,
    id: `${songId}-audio-${i}`,
    songId,
  }));
}

const VISUAL_TEMPLATE: Omit<MockVisualAsset, "id" | "songId">[] = [
  {
    category: "Cover Art",
    filename: "cover_final_3000x3000.tif",
    state: "Approved",
    version: "v4",
    creator: "JD",
    lastUpdated: "2026-08-19T14:00:00Z",
  },
  {
    category: "Cover Art",
    filename: "cover_alt_grain.tif",
    state: "Review",
    version: "v2",
    creator: "JD",
    lastUpdated: "2026-08-18T10:30:00Z",
  },
  {
    category: "Music Video",
    filename: "mv_edit_rough_02.mp4",
    state: "In Progress",
    version: "v2",
    creator: "MG",
    lastUpdated: "2026-08-24T21:15:00Z",
  },
  {
    category: "Visualizer",
    filename: "visualizer_loop_4k.mp4",
    state: "Final",
    version: "v1",
    creator: "JD",
    lastUpdated: "2026-08-11T08:45:00Z",
  },
  {
    category: "Spotify Canvas",
    filename: "canvas_9x16.mp4",
    state: "Missing",
    version: "—",
    creator: "—",
    lastUpdated: "—",
  },
  {
    category: "Promo Assets",
    filename: "promo_kit_press.zip",
    state: "In Progress",
    version: "v1",
    creator: "KM",
    lastUpdated: "2026-08-22T13:20:00Z",
  },
  {
    category: "Social Content",
    filename: "post_pack_ig_01.zip",
    state: "Approved",
    version: "v3",
    creator: "AR",
    lastUpdated: "2026-08-25T17:50:00Z",
  },
  {
    category: "Social Content",
    filename: "story_frames.psd",
    state: "Review",
    version: "v1",
    creator: "AR",
    lastUpdated: "2026-08-26T09:00:00Z",
  },
];

export const VISUAL_CATEGORIES: VisualCategory[] = [
  "Cover Art",
  "Music Video",
  "Visualizer",
  "Spotify Canvas",
  "Promo Assets",
  "Social Content",
];

export function getVisualAssets(songId: string): MockVisualAsset[] {
  const index = mockSongs.findIndex((s) => s.id === songId);
  if (index < 0) return [];
  const depth = [8, 8, 8, 8, 0, 6, 0, 2][index] ?? 0;
  return VISUAL_TEMPLATE.slice(0, depth).map((asset, i) => ({
    ...asset,
    id: `${songId}-visual-${i}`,
    songId,
  }));
}
