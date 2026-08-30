import { http } from "./client";
import type { CalendarEntry } from "@/types";

export const calendarApi = {
  getCalendar(from?: string, to?: string): Promise<CalendarEntry[]> {
    const searchParams = new URLSearchParams();
    if (from) searchParams.set("from", from);
    if (to) searchParams.set("to", to);

    const queryString = searchParams.toString();
    return http.get<CalendarEntry[]>(`/api/calendar${queryString ? `?${queryString}` : ""}`);
  },
};
