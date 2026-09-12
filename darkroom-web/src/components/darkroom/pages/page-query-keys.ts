export const songsQueryKey = ["songs"] as const;
export const dashboardQueryKey = ["dashboard"] as const;

export function calendarQueryKey(start: string, end: string) {
  return ["calendar", start, end] as const;
}
