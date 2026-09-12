import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api/client";
import type { Song, SongMember } from "@/types";
import { renderWithQueryClient } from "@/test/render";
import { deriveSongAccess } from "../shared";

const {
  getSongMembersMock,
  getSongInvitationsMock,
  inviteSongMemberMock,
  removeSongMemberMock,
  revokeSongInvitationMock,
  updateSongMemberRoleMock,
} = vi.hoisted(() => ({
  getSongMembersMock: vi.fn(),
  getSongInvitationsMock: vi.fn(),
  inviteSongMemberMock: vi.fn(),
  removeSongMemberMock: vi.fn(),
  revokeSongInvitationMock: vi.fn(),
  updateSongMemberRoleMock: vi.fn(),
}));

vi.mock("@/services/api/collaboration", () => ({
  invitationInboxQueryKey: ["invitations"],
  songMembersQueryKey: (songId: string) => ["songs", songId, "members"],
  collaborationApi: {
    getSongMembers: getSongMembersMock,
    getSongInvitations: getSongInvitationsMock,
    inviteSongMember: inviteSongMemberMock,
    removeSongMember: removeSongMemberMock,
    revokeSongInvitation: revokeSongInvitationMock,
    updateSongMemberRole: updateSongMemberRoleMock,
  },
}));

import { SongMembersDialog } from "./SongMembersDialog";

const ownerSong: Song = {
  id: 7,
  title: "Night Protocol",
  status: "Mixing",
  createdAt: "2026-09-01T10:00:00Z",
  currentUserRole: "OWNER",
  canEdit: true,
  canManageMembers: true,
};

const editorSong: Song = {
  ...ownerSong,
  currentUserRole: "EDITOR",
  canEdit: true,
  canManageMembers: false,
};

const viewerSong: Song = {
  ...ownerSong,
  currentUserRole: "VIEWER",
  canEdit: false,
  canManageMembers: false,
};

const members: SongMember[] = [
  {
    memberId: null,
    userId: 1,
    email: "owner@example.com",
    displayName: "Owner Artist",
    role: "OWNER",
    joinedAt: null,
  },
  {
    memberId: 22,
    userId: 2,
    email: "editor@example.com",
    displayName: "Editor One",
    role: "EDITOR",
    joinedAt: "2026-09-02T10:00:00Z",
  },
  {
    memberId: 23,
    userId: 3,
    email: "viewer@example.com",
    displayName: "Viewer One",
    role: "VIEWER",
    joinedAt: "2026-09-03T10:00:00Z",
  },
];

const pendingInvitation = {
  id: 55,
  songId: 7,
  invitedUser: {
    id: 4,
    email: "pending@example.com",
    displayName: "Pending Person",
  },
  invitedByUser: {
    id: 1,
    email: "owner@example.com",
    displayName: "Owner Artist",
  },
  role: "VIEWER",
  status: "PENDING",
  createdAt: "2026-09-04T10:00:00Z",
  respondedAt: null,
};

function renderMembers(song = ownerSong) {
  return renderWithQueryClient(<SongMembersDialog song={song} access={deriveSongAccess(song)} />);
}

async function openMembers(song = ownerSong) {
  const user = userEvent.setup();
  renderMembers(song);
  await user.click(screen.getByRole("button", { name: "Members" }));
  await screen.findByRole("dialog", { name: "Members" });
  return user;
}

describe("SongMembersDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSongMembersMock.mockResolvedValue(members);
    getSongInvitationsMock.mockResolvedValue([pendingInvitation]);
    inviteSongMemberMock.mockResolvedValue(pendingInvitation);
    removeSongMemberMock.mockResolvedValue(undefined);
    revokeSongInvitationMock.mockResolvedValue({ ...pendingInvitation, status: "REVOKED" });
    updateSongMemberRoleMock.mockResolvedValue({ ...members[1], role: "VIEWER" });
  });

  afterEach(() => {
    cleanup();
    document.body.style.pointerEvents = "";
    document.body.removeAttribute("data-scroll-locked");
  });

  it("renders the owner row as non-removable workspace ownership", async () => {
    await openMembers();

    const ownerRow = screen.getByText("Owner Artist").closest("div");
    expect(screen.getByText("Workspace owner")).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(ownerRow).not.toBeNull();
    expect(screen.getAllByText("Owner").length).toBeGreaterThanOrEqual(1);
  });

  it("gives owners invite, role, remove, and revoke controls", async () => {
    await openMembers();

    expect(await screen.findByLabelText("Existing account email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite collaborator" })).toBeInTheDocument();
    expect(screen.getByLabelText("Role for editor@example.com")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Revoke" })).toBeInTheDocument();
  });

  it("lets editors view members without management controls", async () => {
    await openMembers(editorSong);

    expect(await screen.findByText("Editor One")).toBeInTheDocument();
    expect(
      screen.getByText(/Only the owner can invite, remove, or change roles./),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Invite collaborator" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    expect(getSongInvitationsMock).not.toHaveBeenCalled();
  });

  it("lets viewers view members without management controls", async () => {
    await openMembers(viewerSong);

    expect(await screen.findByText("Viewer One")).toBeInTheDocument();
    expect(
      screen.getByText(/Only the owner can invite, remove, or change roles./),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Invite collaborator" })).not.toBeInTheDocument();
  });

  it("invites an existing account by email and role", async () => {
    const user = await openMembers();

    await user.type(screen.getByLabelText("Existing account email"), "pending@example.com");
    await user.click(screen.getByRole("button", { name: "Invite collaborator" }));

    expect(inviteSongMemberMock).toHaveBeenCalledWith("7", {
      email: "pending@example.com",
      role: "EDITOR",
    });
    expect(await screen.findByText("Invitation created.")).toBeInTheDocument();
  });

  it("locks invite fields while an invitation request is pending", async () => {
    const user = await openMembers();
    inviteSongMemberMock.mockReturnValue(new Promise(() => {}));

    await user.type(screen.getByLabelText("Existing account email"), "pending@example.com");
    await user.click(screen.getByRole("button", { name: "Invite collaborator" }));

    expect(inviteSongMemberMock).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Existing account email")).toBeDisabled();
    expect(screen.getByLabelText("Invitation role")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Inviting" })).toBeDisabled();
  });

  it("surfaces duplicate invite and unknown email errors from the backend", async () => {
    const user = await openMembers();
    inviteSongMemberMock.mockRejectedValueOnce(
      new ApiError("A pending invitation already exists for this user.", 409),
    );
    inviteSongMemberMock.mockRejectedValueOnce(
      new ApiError("Invite an existing DARKROOM account email.", 400),
    );

    await user.type(screen.getByLabelText("Existing account email"), "pending@example.com");
    await user.click(screen.getByRole("button", { name: "Invite collaborator" }));
    expect(
      await screen.findByText("A pending invitation already exists for this user."),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Existing account email"));
    await user.type(screen.getByLabelText("Existing account email"), "missing@example.com");
    await user.click(screen.getByRole("button", { name: "Invite collaborator" }));
    expect(
      await screen.findByText("Invite an existing DARKROOM account email."),
    ).toBeInTheDocument();
  });

  it("clears invite errors when the owner edits the invite form", async () => {
    const user = await openMembers();
    inviteSongMemberMock.mockRejectedValueOnce(
      new ApiError("A pending invitation already exists for this user.", 409),
    );

    await user.type(screen.getByLabelText("Existing account email"), "pending@example.com");
    await user.click(screen.getByRole("button", { name: "Invite collaborator" }));
    expect(
      await screen.findByText("A pending invitation already exists for this user."),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Existing account email"), ".retry");

    expect(
      screen.queryByText("A pending invitation already exists for this user."),
    ).not.toBeInTheDocument();
  });

  it("keeps owner out of assignable collaborator role options", async () => {
    const user = await openMembers();

    await user.click(screen.getByLabelText("Invitation role"));
    expect(screen.queryByRole("option", { name: "Owner" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByLabelText("Role for editor@example.com"));
    expect(screen.queryByRole("option", { name: "Owner" })).not.toBeInTheDocument();
  });

  it("changes collaborator roles through the member PATCH endpoint", async () => {
    const user = await openMembers();

    await user.click(screen.getByLabelText("Role for editor@example.com"));
    await user.click(await screen.findByRole("option", { name: "Viewer" }));

    expect(updateSongMemberRoleMock).toHaveBeenCalledWith("7", "22", { role: "VIEWER" });
  });

  it("removes collaborators after confirmation", async () => {
    const user = await openMembers();

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]!);
    const alert = await screen.findByRole("alertdialog");
    await user.click(within(alert).getByRole("button", { name: "Remove" }));

    expect(removeSongMemberMock).toHaveBeenCalledWith("7", "22");
  });

  it("surfaces stale remove failures without removing the row", async () => {
    const user = await openMembers();
    removeSongMemberMock.mockRejectedValue(new ApiError("Member is no longer removable.", 404));

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]!);
    const alert = await screen.findByRole("alertdialog");
    await user.click(within(alert).getByRole("button", { name: "Remove" }));

    expect(await screen.findByText("Member is no longer removable.")).toBeInTheDocument();
    expect(screen.getByText("Editor One")).toBeInTheDocument();
  });

  it("revokes pending invitations after confirmation", async () => {
    const user = await openMembers();

    await user.click(screen.getByRole("button", { name: "Revoke" }));
    const alert = await screen.findByRole("alertdialog");
    await user.click(within(alert).getByRole("button", { name: "Revoke" }));

    expect(revokeSongInvitationMock).toHaveBeenCalledWith("7", "55");
  });

  it("surfaces stale revoke failures without hiding the pending invitation", async () => {
    const user = await openMembers();
    revokeSongInvitationMock.mockRejectedValue(
      new ApiError("Invitation is no longer pending.", 409),
    );

    await user.click(screen.getByRole("button", { name: "Revoke" }));
    const alert = await screen.findByRole("alertdialog");
    await user.click(within(alert).getByRole("button", { name: "Revoke" }));

    expect(await screen.findByText("Invitation is no longer pending.")).toBeInTheDocument();
    expect(screen.getByText("pending@example.com")).toBeInTheDocument();
  });

  it("preserves full long member and invitation identities for truncated rows", async () => {
    const longEmail =
      "artist.with.an.exceptionally.long.address.for.mobile.layouts@example-darkroom-system.test";
    getSongMembersMock.mockResolvedValueOnce([
      members[0],
      ...Array.from({ length: 12 }, (_, index) => ({
        memberId: 100 + index,
        userId: 200 + index,
        email: index === 0 ? longEmail : `collaborator-${index}@example.com`,
        displayName: index === 0 ? null : `Collaborator ${index}`,
        role: "EDITOR" as const,
        joinedAt: "2026-09-03T10:00:00Z",
      })),
    ]);
    getSongInvitationsMock.mockResolvedValueOnce([
      {
        ...pendingInvitation,
        invitedUser: {
          ...pendingInvitation.invitedUser,
          email: longEmail,
          displayName: null,
        },
      },
    ]);

    await openMembers();

    expect((await screen.findAllByText(longEmail)).length).toBeGreaterThanOrEqual(2);
    for (const email of screen.getAllByText(longEmail)) {
      expect(email).toHaveAttribute("title", longEmail);
    }
    expect(screen.getByText("1 pending")).toBeInTheDocument();
  });

  it("renders loading, empty, and error states", async () => {
    getSongMembersMock.mockReturnValueOnce(new Promise(() => {}));
    const loading = renderMembers();
    await userEvent.click(screen.getByRole("button", { name: "Members" }));
    expect(await screen.findByText("Loading members")).toBeInTheDocument();
    loading.unmount();
    cleanup();
    document.body.style.pointerEvents = "";
    document.body.removeAttribute("data-scroll-locked");

    getSongMembersMock.mockResolvedValueOnce([]);
    getSongInvitationsMock.mockResolvedValueOnce([]);
    await openMembers();
    expect(await screen.findByText("No members yet")).toBeInTheDocument();
    expect(screen.getByText("No pending invitations")).toBeInTheDocument();
    cleanup();
    document.body.style.pointerEvents = "";
    document.body.removeAttribute("data-scroll-locked");

    getSongMembersMock.mockRejectedValueOnce(new Error("Nope"));
    await openMembers();
    expect(await screen.findByText("Members unavailable")).toBeInTheDocument();
  });

  it("handles stale 403 management failures without hiding member data", async () => {
    const user = await openMembers();
    updateSongMemberRoleMock.mockRejectedValue(new ApiError("Forbidden", 403));

    await user.click(screen.getByLabelText("Role for editor@example.com"));
    await user.click(await screen.findByRole("option", { name: "Viewer" }));

    expect(await screen.findByText("Forbidden")).toBeInTheDocument();
    expect(screen.getByText("Editor One")).toBeInTheDocument();
  });
});
