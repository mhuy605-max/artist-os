import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/components/darkroom/Workbench";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
