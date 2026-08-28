import type { TeamMember } from "@/types";

/** MOCK team. No auth or permission system exists yet. */
export const teamMembers: TeamMember[] = [
  {
    id: "tm-1",
    name: "Vera Sol",
    role: "Owner",
    email: "vessel@darkroom.system",
    projects: ["NIGHT PROTOCOL", "COLD ROOM", "PAPER SKIN", "BLEACH"],
    lastActivity: "2026-08-28T17:40:00Z",
  },
  {
    id: "tm-2",
    name: "Kira Mott",
    role: "Producer",
    email: "kira@darkroom.system",
    projects: ["NIGHT PROTOCOL", "STATIC LOVER", "SILVER EXIT"],
    lastActivity: "2026-08-28T17:10:00Z",
  },
  {
    id: "tm-3",
    name: "Aden Ruiz",
    role: "Engineer",
    email: "aden@darkroom.system",
    projects: ["NIGHT PROTOCOL", "BLEACH", "STATIC LOVER"],
    lastActivity: "2026-08-27T21:35:00Z",
  },
  {
    id: "tm-4",
    name: "Tomas Lind",
    role: "Engineer",
    email: "tomas@lindmasters.co",
    projects: ["COLD ROOM", "GHOST FREQUENCY"],
    lastActivity: "2026-08-27T08:00:00Z",
  },
  {
    id: "tm-5",
    name: "June Dahl",
    role: "Collaborator",
    email: "june@darkroom.system",
    projects: ["STATIC LOVER", "SILVER EXIT"],
    lastActivity: "2026-08-28T13:44:00Z",
  },
  {
    id: "tm-6",
    name: "Mara Gill",
    role: "Manager",
    email: "mara@grainfilm.co",
    projects: ["COLD ROOM"],
    lastActivity: "2026-08-24T21:15:00Z",
  },
  {
    id: "tm-7",
    name: "Noor Farid",
    role: "Admin",
    email: "noor@darkroom.system",
    projects: ["All projects"],
    lastActivity: "2026-08-26T09:12:00Z",
  },
];

export function getSongTeam(songId: string): TeamMember[] {
  void songId;
  return teamMembers.slice(0, 4);
}
