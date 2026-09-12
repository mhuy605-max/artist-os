import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api/client";
import { renderWithQueryClient } from "@/test/render";

const {
  acceptInvitationMock,
  declineInvitationMock,
  getInvitationsMock,
  getMeMock,
  logoutMock,
  navigateMock,
} = vi.hoisted(() => ({
  acceptInvitationMock: vi.fn(),
  declineInvitationMock: vi.fn(),
  getInvitationsMock: vi.fn(),
  getMeMock: vi.fn(),
  logoutMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    className,
    title,
    onClick,
  }: {
    to: string;
    params?: Record<string, string>;
    children: React.ReactNode;
    className?: string;
    title?: string;
    onClick?: () => void;
  }) => {
    const href = params?.["songId"] ? to.replace("$songId", params["songId"]) : to;
    return (
      <a href={href} className={className} title={title} onClick={onClick}>
        {children}
      </a>
    );
  },
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

vi.mock("@/services/api/collaboration", () => ({
  invitationInboxQueryKey: ["invitations"],
  songMembersQueryKey: (songId: string) => ["songs", songId, "members"],
  collaborationApi: {
    getInvitations: getInvitationsMock,
    acceptInvitation: acceptInvitationMock,
    declineInvitation: declineInvitationMock,
  },
}));

import { TeamPage } from "./pages/TeamPage";

const inboxInvitation = {
  invitationId: 44,
  songId: 7,
  songTitle: "Night Protocol",
  invitedByUser: {
    id: 1,
    email: "owner@example.com",
    displayName: "Owner Artist",
  },
  role: "EDITOR",
  status: "PENDING",
  createdAt: "2026-09-04T10:00:00Z",
};

describe("TeamPage invitation inbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMeMock.mockResolvedValue({
      id: 2,
      email: "artist@example.com",
      displayName: "Artist",
    });
    getInvitationsMock.mockResolvedValue([inboxInvitation]);
    acceptInvitationMock.mockResolvedValue({
      id: 44,
      songId: 7,
      role: "EDITOR",
      status: "ACCEPTED",
      createdAt: "2026-09-04T10:00:00Z",
      respondedAt: "2026-09-04T10:05:00Z",
      invitedUser: { id: 2, email: "artist@example.com", displayName: "Artist" },
      invitedByUser: inboxInvitation.invitedByUser,
    });
    declineInvitationMock.mockResolvedValue({
      id: 44,
      songId: 7,
      role: "EDITOR",
      status: "DECLINED",
      createdAt: "2026-09-04T10:00:00Z",
      respondedAt: "2026-09-04T10:05:00Z",
      invitedUser: { id: 2, email: "artist@example.com", displayName: "Artist" },
      invitedByUser: inboxInvitation.invitedByUser,
    });
  });

  it("renders pending song invitations without global team claims", async () => {
    renderWithQueryClient(<TeamPage />);

    expect(await screen.findByRole("heading", { name: "Song invitations" })).toBeInTheDocument();
    expect(screen.getByText("Invitation inbox")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Night Protocol" })).toHaveAttribute(
      "href",
      "/songs/7",
    );
    expect(screen.getByText("Invited by Owner Artist as Editor.")).toBeInTheDocument();
    expect(screen.queryByText("Future teams")).not.toBeInTheDocument();
  });

  it("waits for the authenticated shell before loading invitations", async () => {
    getMeMock.mockReturnValue(new Promise(() => {}));

    renderWithQueryClient(<TeamPage />);

    expect(await screen.findByText("Restoring session")).toBeInTheDocument();
    expect(getInvitationsMock).not.toHaveBeenCalled();
  });

  it("accepts an invitation and refreshes collaboration state", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TeamPage />);

    await user.click(await screen.findByRole("button", { name: /accept/i }));

    expect(acceptInvitationMock).toHaveBeenCalledWith("44");
    expect(await screen.findByText("Invitation accepted.")).toBeInTheDocument();
  });

  it("locks invitation actions while one response is pending", async () => {
    const user = userEvent.setup();
    acceptInvitationMock.mockReturnValue(new Promise(() => {}));
    renderWithQueryClient(<TeamPage />);

    await user.click(await screen.findByRole("button", { name: /accept/i }));

    expect(acceptInvitationMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /decline/i })).toBeDisabled();
  });

  it("declines an invitation and refreshes the inbox", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TeamPage />);

    await user.click(await screen.findByRole("button", { name: /decline/i }));

    expect(declineInvitationMock).toHaveBeenCalledWith("44");
    expect(await screen.findByText("Invitation declined.")).toBeInTheDocument();
  });

  it("shows an empty invitation inbox", async () => {
    getInvitationsMock.mockResolvedValue([]);

    renderWithQueryClient(<TeamPage />);

    expect(await screen.findByText("No pending invitations")).toBeInTheDocument();
    expect(
      screen.getByText("Song workspace invitations for your account will appear here."),
    ).toBeInTheDocument();
  });

  it("handles stale invitation actions with a clear 404 message", async () => {
    const user = userEvent.setup();
    acceptInvitationMock.mockRejectedValue(new ApiError("Missing", 404));

    renderWithQueryClient(<TeamPage />);

    await user.click(await screen.findByRole("button", { name: /accept/i }));

    expect(await screen.findByText("Invitation is no longer available.")).toBeInTheDocument();
    await waitFor(() => expect(getInvitationsMock).toHaveBeenCalled());
  });

  it("handles stale invitation conflicts with a clear message", async () => {
    const user = userEvent.setup();
    acceptInvitationMock.mockRejectedValue(
      new ApiError('{"title":"Invitation is no longer pending."}', 409),
    );

    renderWithQueryClient(<TeamPage />);

    await user.click(await screen.findByRole("button", { name: /accept/i }));

    expect(await screen.findByText("Invitation is no longer pending.")).toBeInTheDocument();
  });

  it("preserves long song titles on truncated inbox links", async () => {
    const longTitle =
      "Night Protocol Extended Director Cut With A Very Long Collaboration Workspace Title";
    getInvitationsMock.mockResolvedValue([{ ...inboxInvitation, songTitle: longTitle }]);

    renderWithQueryClient(<TeamPage />);

    expect(await screen.findByRole("link", { name: longTitle })).toHaveAttribute(
      "title",
      longTitle,
    );
  });

  it("keeps the Team route reachable from protected navigation", async () => {
    renderWithQueryClient(<TeamPage />);

    const teamLinks = await screen.findAllByRole("link", { name: "Team" });
    expect(teamLinks.some((link) => link.getAttribute("href") === "/team")).toBe(true);
  });

  it("keeps the inbox usable at narrow widths", async () => {
    window.innerWidth = 390;
    window.dispatchEvent(new Event("resize"));

    renderWithQueryClient(<TeamPage />);

    expect(await screen.findByRole("link", { name: "Night Protocol" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
  });
});
