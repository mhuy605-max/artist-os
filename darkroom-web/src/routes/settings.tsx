import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/components/darkroom/Workbench";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
