import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/components/darkroom/pages/SettingsPage";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
