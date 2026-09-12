import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/components/darkroom/pages/LoginPage";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
