import type { Credit } from "@/types";
import { mockSongs } from "./songs";

/** MOCK credits. Split percentages are a PLANNED feature, not real data. */
const TEMPLATE: Omit<Credit, "id" | "songId">[] = [
  {
    name: "VESSEL",
    role: "Artist",
    contact: "vessel@darkroom.system",
    status: "Confirmed",
    plannedSplit: 45,
  },
  {
    name: "Kira Mott",
    role: "Producer",
    contact: "kira@darkroom.system",
    status: "Confirmed",
    plannedSplit: 25,
  },
  {
    name: "Aden Ruiz",
    role: "Songwriter",
    contact: "aden@darkroom.system",
    status: "Confirmed",
    plannedSplit: 20,
  },
  {
    name: "Aden Ruiz",
    role: "Recording Engineer",
    contact: "aden@darkroom.system",
    status: "Confirmed",
  },
  {
    name: "Kira Mott",
    role: "Mix Engineer",
    contact: "kira@darkroom.system",
    status: "Confirmed",
  },
  {
    name: "Tomas Lind",
    role: "Mastering Engineer",
    contact: "tomas@lindmasters.co",
    status: "Pending",
    plannedSplit: 10,
  },
  {
    name: "Mara Gill",
    role: "Director",
    contact: "mara@grainfilm.co",
    status: "Invited",
  },
  {
    name: "June Dahl",
    role: "Designer",
    contact: "june@darkroom.system",
    status: "Confirmed",
  },
];

export function getCredits(songId: string): Credit[] {
  const index = mockSongs.findIndex((s) => s.id === songId);
  if (index < 0) return [];
  const depth = [8, 8, 8, 8, 1, 6, 0, 3][index] ?? 0;
  return TEMPLATE.slice(0, depth).map((credit, i) => ({
    ...credit,
    id: `${songId}-credit-${i}`,
    songId,
  }));
}
