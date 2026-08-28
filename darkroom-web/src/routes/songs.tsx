import { createFileRoute } from "@tanstack/react-router";

import { SongsPage } from "@/components/darkroom/Workbench";

export const Route = createFileRoute("/songs")({
  component: SongsPage,
});
