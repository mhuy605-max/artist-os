import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/components/darkroom/Workbench";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
