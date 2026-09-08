import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "@/test/render";

const { getMeMock, logoutMock, navigateMock } = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  logoutMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    className,
    onClick,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  ),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useLocation: () => ({ pathname: "/team" }),
  useNavigate: () => navigateMock,
}));

vi.mock("@/services/api/auth", () => ({
  authQueryKey: ["auth", "me"],
  authApi: {
    me: getMeMock,
    logout: logoutMock,
  },
}));

import { TeamPage } from "./Workbench";

describe("TeamPage", () => {
  beforeEach(() => {
    getMeMock.mockReset();
    logoutMock.mockReset();
    navigateMock.mockReset();
    getMeMock.mockResolvedValue({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });
  });

  it("renders an honest personal-workspace state", async () => {
    renderWithQueryClient(<TeamPage />);

    expect(await screen.findByRole("heading", { name: "Personal workspace" })).toBeInTheDocument();
    expect(
      screen.getByText("DARKROOM SYSTEM V1 is currently built for a single artist account."),
    ).toBeInTheDocument();
  });

  it("shows future collaboration copy without implying active team membership", async () => {
    renderWithQueryClient(<TeamPage />);

    expect(
      await screen.findByText(
        "Team collaboration, shared project access, invitations, and role-based permissions are planned for a future release.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();
    expect(screen.queryByText("Members")).not.toBeInTheDocument();
  });

  it("does not render fake collaborators or invite actions", async () => {
    renderWithQueryClient(<TeamPage />);

    expect(await screen.findByText("Personal workspace")).toBeInTheDocument();
    expect(screen.queryByText("Vera Sol")).not.toBeInTheDocument();
    expect(screen.queryByText("Kira Mott")).not.toBeInTheDocument();
    expect(screen.queryByText("tomas@lindmasters.co")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /invite/i })).not.toBeInTheDocument();
  });

  it("keeps the Team route reachable from protected navigation", async () => {
    renderWithQueryClient(<TeamPage />);

    const teamLinks = await screen.findAllByRole("link", { name: "Team" });
    expect(teamLinks.some((link) => link.getAttribute("href") === "/team")).toBe(true);
  });

  it("keeps the planned-state structure usable at narrow widths", async () => {
    window.innerWidth = 390;
    window.dispatchEvent(new Event("resize"));

    renderWithQueryClient(<TeamPage />);

    expect(await screen.findByText("Single account")).toBeInTheDocument();
    expect(screen.getByText("Private songs")).toBeInTheDocument();
    expect(screen.getByText("Future teams")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  });
});
