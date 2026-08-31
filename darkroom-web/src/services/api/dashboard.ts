import { http } from "./client";
import type { DashboardResponse } from "@/types";

export const dashboardApi = {
  getDashboard(): Promise<DashboardResponse> {
    return http.get<DashboardResponse>("/api/dashboard");
  },
};
