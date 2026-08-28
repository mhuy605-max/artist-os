import { createFileRoute } from "@tanstack/react-router";

import { SongWorkspacePage } from "@/components/darkroom/Workbench";

export const Route = createFileRoute("/songs_/$songId")({
  component: SongRoute,
});

function SongRoute() {
  const { songId } = Route.useParams();

  return <SongWorkspacePage songId={songId} />;
}
