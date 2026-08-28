import type { ActivityEvent } from "@/types";
import { mockSongs } from "./songs";

/** MOCK activity feed. */
export const globalActivity: ActivityEvent[] = [
  {
    id: "act-1",
    songId: mockSongs[0]!.id,
    songTitle: "NIGHT PROTOCOL",
    actor: "KM",
    action: "uploaded mix_v7.wav",
    at: "2026-08-28T17:10:00Z",
  },
  {
    id: "act-2",
    songId: mockSongs[2]!.id,
    songTitle: "STATIC LOVER",
    actor: "JD",
    action: "approved cover artwork v4",
    at: "2026-08-28T13:44:00Z",
  },
  {
    id: "act-3",
    songId: mockSongs[5]!.id,
    songTitle: "SILVER EXIT",
    actor: "KM",
    action: "changed release date to 26 SEP 2026",
    at: "2026-08-27T18:02:00Z",
  },
  {
    id: "act-4",
    songId: mockSongs[2]!.id,
    songTitle: "STATIC LOVER",
    actor: "AR",
    action: "scheduled Teaser 01 for 01 SEP",
    at: "2026-08-27T10:20:00Z",
  },
  {
    id: "act-5",
    songId: mockSongs[1]!.id,
    songTitle: "COLD ROOM",
    actor: "TL",
    action: "delivered master_-9LUFS_v2.wav",
    at: "2026-08-27T08:00:00Z",
  },
  {
    id: "act-6",
    songId: mockSongs[7]!.id,
    songTitle: "BLEACH",
    actor: "AR",
    action: "logged vocal tracking session",
    at: "2026-08-26T21:35:00Z",
  },
  {
    id: "act-7",
    songId: mockSongs[3]!.id,
    songTitle: "GHOST FREQUENCY",
    actor: "SYSTEM",
    action: "analytics sync completed",
    at: "2026-08-26T04:00:00Z",
  },
];

export function getSongActivity(songId: string): ActivityEvent[] {
  const scoped = globalActivity.filter((event) => event.songId === songId);
  if (scoped.length > 0) return scoped;
  return [
    {
      id: `${songId}-act-0`,
      songId,
      actor: "SYSTEM",
      action: "project created",
      at: "2026-08-01T09:00:00Z",
    },
  ];
}

export interface UpcomingItem {
  id: string;
  label: string;
  song: string;
  date: string;
  kind: string;
}

export const upcomingItems: UpcomingItem[] = [
  {
    id: "up-1",
    label: "Teaser 01 publish",
    song: "STATIC LOVER",
    date: "2026-09-01",
    kind: "Teaser",
  },
  {
    id: "up-2",
    label: "Cover artwork delivery",
    song: "SILVER EXIT",
    date: "2026-09-03",
    kind: "Artwork",
  },
  { id: "up-3", label: "Release", song: "STATIC LOVER", date: "2026-09-05", kind: "Release" },
  {
    id: "up-4",
    label: "Short — chorus vertical",
    song: "STATIC LOVER",
    date: "2026-09-08",
    kind: "Content",
  },
  { id: "up-5", label: "Release", song: "COLD ROOM", date: "2026-09-18", kind: "Release" },
  {
    id: "up-6",
    label: "Music video premiere",
    song: "COLD ROOM",
    date: "2026-09-18",
    kind: "Music Video",
  },
  { id: "up-7", label: "Release", song: "SILVER EXIT", date: "2026-09-26", kind: "Release" },
  {
    id: "up-8",
    label: "Master upload deadline",
    song: "NIGHT PROTOCOL",
    date: "2026-09-29",
    kind: "Milestone",
  },
];

export interface SongTask {
  id: string;
  label: string;
  due: string;
  owner: string;
  done: boolean;
}

export function getSongTasks(songId: string): SongTask[] {
  return [
    { id: `${songId}-t1`, label: "Final mix approval", due: "2026-09-02", owner: "VS", done: false },
    {
      id: `${songId}-t2`,
      label: "Cover artwork delivery",
      due: "2026-09-03",
      owner: "JD",
      done: true,
    },
    { id: `${songId}-t3`, label: "Upload master", due: "2026-09-06", owner: "TL", done: false },
    { id: `${songId}-t4`, label: "Schedule teaser", due: "2026-09-08", owner: "AR", done: false },
  ];
}
