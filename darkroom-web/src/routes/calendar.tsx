import { createFileRoute } from "@tanstack/react-router";

import { CalendarPage } from "@/components/darkroom/pages/CalendarPage";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});
