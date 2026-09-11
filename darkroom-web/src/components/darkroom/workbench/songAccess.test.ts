import { describe, expect, it } from "vitest";

import { deriveSongAccess } from "./shared";
import type { Song } from "@/types";

function songWithAccess(access: Partial<Song>): Song {
  return {
    id: 1,
    title: "Night Protocol",
    status: "Demo",
    createdAt: "2026-09-01T10:00:00Z",
    ...access,
  };
}

describe("deriveSongAccess", () => {
  it("derives owner workspace capabilities from backend metadata", () => {
    const access = deriveSongAccess(
      songWithAccess({
        currentUserRole: "OWNER",
        canEdit: true,
        canManageMembers: true,
      }),
    );

    expect(access).toMatchObject({
      role: "OWNER",
      canEdit: true,
      canManageMembers: true,
      canDeleteSong: true,
      canProvisionDrive: true,
      isReadOnly: false,
      isOwner: true,
      isEditor: false,
      isViewer: false,
    });
  });

  it("derives editor workspace capabilities without owner-only actions", () => {
    const access = deriveSongAccess(
      songWithAccess({
        currentUserRole: "EDITOR",
        canEdit: true,
        canManageMembers: false,
      }),
    );

    expect(access).toMatchObject({
      role: "EDITOR",
      canEdit: true,
      canManageMembers: false,
      canDeleteSong: false,
      canProvisionDrive: false,
      isReadOnly: false,
      isOwner: false,
      isEditor: true,
      isViewer: false,
    });
  });

  it("derives viewer read-only capabilities", () => {
    const access = deriveSongAccess(
      songWithAccess({
        currentUserRole: "VIEWER",
        canEdit: false,
        canManageMembers: false,
      }),
    );

    expect(access).toMatchObject({
      role: "VIEWER",
      canEdit: false,
      canManageMembers: false,
      canDeleteSong: false,
      canProvisionDrive: false,
      isReadOnly: true,
      isOwner: false,
      isEditor: false,
      isViewer: true,
    });
  });

  it("fails closed for missing or malformed backend access metadata", () => {
    expect(deriveSongAccess(songWithAccess({}))).toMatchObject({
      role: null,
      canEdit: false,
      canManageMembers: false,
      canDeleteSong: false,
      canProvisionDrive: false,
      isReadOnly: true,
    });

    expect(
      deriveSongAccess(
        songWithAccess({
          currentUserRole: "ADMIN",
          canEdit: true,
          canManageMembers: true,
        } as Partial<Song>),
      ),
    ).toMatchObject({
      role: null,
      canEdit: false,
      canManageMembers: false,
      canDeleteSong: false,
      canProvisionDrive: false,
      isReadOnly: true,
    });
  });
});
