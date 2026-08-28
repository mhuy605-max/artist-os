import { createFileRoute } from "@tanstack/react-router";

import { TeamPage } from "@/components/darkroom/Workbench";

export const Route = createFileRoute("/team")({
  component: TeamPage,
});
