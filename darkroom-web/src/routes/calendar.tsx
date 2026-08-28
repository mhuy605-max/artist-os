import { createFileRoute } from "@tanstack/react-router";

import { CalendarPage } from "@/components/darkroom/Workbench";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});
