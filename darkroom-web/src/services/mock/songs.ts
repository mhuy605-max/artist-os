import type { Song, SongMeta } from "@/types";

/**
 * Fallback song records used only when the real .NET API is unreachable.
 * Shape matches the real API exactly.
 */
export const mockSongs: Song[] = [
  {
    id: "1f0a1c31-0001-4a01-9a01-000000000001",
    title: "NIGHT PROTOCOL",
    status: "Mixing",
    createdAt: "2026-05-04T09:12:00Z",
  },
  {
    id: "1f0a1c31-0002-4a01-9a01-000000000002",
    title: "COLD ROOM",
    status: "Mastering",
    createdAt: "2026-04-18T14:40:00Z",
  },
  {
    id: "1f0a1c31-0003-4a01-9a01-000000000003",
    title: "STATIC LOVER",
    status: "ContentCampaign",
    createdAt: "2026-03-02T11:05:00Z",
  },
  {
    id: "1f0a1c31-0004-4a01-9a01-000000000004",
    title: "GHOST FREQUENCY",
    status: "Released",
    createdAt: "2026-01-22T08:30:00Z",
  },
  {
    id: "1f0a1c31-0005-4a01-9a01-000000000005",
    title: "PAPER SKIN",
    status: "Demo",
    createdAt: "2026-06-11T19:25:00Z",
  },
  {
    id: "1f0a1c31-0006-4a01-9a01-000000000006",
    title: "SILVER EXIT",
    status: "ReleasePreparation",
    createdAt: "2026-02-27T16:00:00Z",
  },
  {
    id: "1f0a1c31-0007-4a01-9a01-000000000007",
    title: "LOW ORBIT",
    status: "Idea",
    createdAt: "2026-07-30T10:15:00Z",
  },
  {
    id: "1f0a1c31-0008-4a01-9a01-000000000008",
    title: "BLEACH",
    status: "Recording",
    createdAt: "2026-06-25T13:45:00Z",
  },
];

/** Extended project metadata — MOCK. No backend fields exist for these yet. */
const META: Omit<SongMeta, "songId">[] = [
  {
    artist: "VESSEL",
    bpm: 128,
    songKey: "F minor",
    genre: "Industrial Pop",
    notes: "Second verse needs a rewrite. Keep the drum bus dirty — no cleanup passes.",
    releaseDate: "2026-10-09",
    lastUpdated: "2026-08-26T17:20:00Z",
    progress: 58,
    collaborators: ["VS", "KM", "AR"],
  },
  {
    artist: "VESSEL",
    bpm: 92,
    songKey: "C# minor",
    genre: "Alt R&B",
    notes: "Master reference: -9 LUFS. Vinyl cut planned for Q1.",
    releaseDate: "2026-09-18",
    lastUpdated: "2026-08-27T08:05:00Z",
    progress: 72,
    collaborators: ["VS", "TL"],
  },
  {
    artist: "NULLFORM",
    bpm: 140,
    songKey: "A minor",
    genre: "Electro",
    notes: "Campaign runs 3 weeks. Two teasers, one BTS cut.",
    releaseDate: "2026-09-05",
    lastUpdated: "2026-08-28T06:40:00Z",
    progress: 86,
    collaborators: ["NF", "KM", "JD", "AR"],
  },
  {
    artist: "NULLFORM",
    bpm: 118,
    songKey: "G minor",
    genre: "Darkwave",
    notes: "Released. Watch retention on the visualizer cut.",
    releaseDate: "2026-03-14",
    lastUpdated: "2026-08-20T12:00:00Z",
    progress: 100,
    collaborators: ["NF", "TL"],
  },
  {
    artist: "VESSEL",
    bpm: 104,
    songKey: "D minor",
    genre: "Ambient Pop",
    notes: "Voice memo demo only. Structure undecided.",
    lastUpdated: "2026-08-14T21:10:00Z",
    progress: 18,
    collaborators: ["VS"],
  },
  {
    artist: "MIRRORFRONT",
    bpm: 126,
    songKey: "B minor",
    genre: "Synth Rock",
    notes: "Metadata locked. Awaiting distributor confirmation.",
    releaseDate: "2026-09-26",
    lastUpdated: "2026-08-25T09:55:00Z",
    progress: 78,
    collaborators: ["MF", "KM"],
  },
  {
    artist: "MIRRORFRONT",
    bpm: 150,
    songKey: "E minor",
    genre: "Breakbeat",
    notes: "Loop sketch in the shared folder. Needs a topline.",
    lastUpdated: "2026-08-27T22:30:00Z",
    progress: 8,
    collaborators: ["MF"],
  },
  {
    artist: "VESSEL",
    bpm: 96,
    songKey: "A♭ major",
    genre: "Art Pop",
    notes: "Tracking vocals this week. Comp lanes 4–9.",
    lastUpdated: "2026-08-28T11:12:00Z",
    progress: 34,
    collaborators: ["VS", "AR"],
  },
];

const FALLBACK_META: Omit<SongMeta, "songId"> = {
  artist: "UNASSIGNED",
  bpm: 120,
  songKey: "—",
  genre: "—",
  notes: "No project notes yet.",
  lastUpdated: new Date().toISOString(),
  progress: 5,
  collaborators: ["VS"],
};

/** Deterministic mock metadata for any song id, including newly created ones. */
export function getSongMeta(songId: string): SongMeta {
  const index = mockSongs.findIndex((s) => s.id === songId);
  const base = index >= 0 ? META[index] ?? FALLBACK_META : FALLBACK_META;
  return { songId, ...base };
}
