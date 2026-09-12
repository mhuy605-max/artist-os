import { createFileRoute } from "@tanstack/react-router";

import { SongsPage } from "@/components/darkroom/pages/SongsPage";

export const Route = createFileRoute("/songs")({
  component: SongsPage,
});
