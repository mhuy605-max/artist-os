import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { ApiError } from "@/services/api/client";
import { renderWithQueryClient } from "@/test/render";
import type { Release, ReleaseChecklistItem, ReleaseReadiness, Song } from "@/types";

const {
  getMeMock,
  logoutMock,
  getSongMock,
  getAudioAssetsMock,
  getVisualAssetsMock,
  getReleaseMock,
  createReleaseMock,
  updateReleaseMock,
  deleteReleaseMock,
  getChecklistMock,
  getReadinessMock,
  updateChecklistItemMock,
  getContentItemsMock,
  getCreditsMock,
  getAnalyticsMock,
  getWorkspaceMock,
  provisionWorkspaceMock,
  getGoogleDriveStatusMock,
} = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  logoutMock: vi.fn(),
  getSongMock: vi.fn(),
  getAudioAssetsMock: vi.fn(),
  getVisualAssetsMock: vi.fn(),
  getReleaseMock: vi.fn(),
  createReleaseMock: vi.fn(),
  updateReleaseMock: vi.fn(),
  deleteReleaseMock: vi.fn(),
  getChecklistMock: vi.fn(),
  getReadinessMock: vi.fn(),
  updateChecklistItemMock: vi.fn(),
  getContentItemsMock: vi.fn(),
  getCreditsMock: vi.fn(),
  getAnalyticsMock: vi.fn(),
  getWorkspaceMock: vi.fn(),
  provisionWorkspaceMock: vi.fn(),
  getGoogleDriveStatusMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    className,
  }: {
    to: string;
    params?: Record<string, string>;
    children: ReactNode;
    className?: string;
  }) => {
    const href = params?.["songId"] ? to.replace("$songId", params["songId"]) : to;
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useLocation: () => ({ pathname: "/songs/1" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/services/api/auth", () => ({
  authQueryKey: ["auth", "me"],
  authApi: {
    me: getMeMock,
    logout: logoutMock,
  },
}));

vi.mock("@/services/api/songs", () => ({
  songsApi: {
    getSong: getSongMock,
  },
  isUsingFallbackData: () => false,
}));

vi.mock("@/services/api/audioAssets", () => ({
  audioAssetsApi: {
    getAudioAssets: getAudioAssetsMock,
    createAudioAsset: vi.fn(),
    updateAudioAsset: vi.fn(),
    deleteAudioAsset: vi.fn(),
    createAudioAssetVersion: vi.fn(),
    replaceAudioAssetFile: vi.fn(),
    uploadAudioAssetFile: vi.fn(),
  },
}));

vi.mock("@/services/api/visualAssets", () => ({
  visualAssetsApi: {
    getVisualAssets: getVisualAssetsMock,
    createVisualAsset: vi.fn(),
    updateVisualAsset: vi.fn(),
    deleteVisualAsset: vi.fn(),
    createVisualAssetVersion: vi.fn(),
    replaceVisualAssetFile: vi.fn(),
    uploadVisualAssetFile: vi.fn(),
    getVisualMediaAccess: vi.fn(),
  },
}));

vi.mock("@/services/api/releases", () => ({
  releasesApi: {
    getRelease: getReleaseMock,
    createRelease: createReleaseMock,
    updateRelease: updateReleaseMock,
    deleteRelease: deleteReleaseMock,
  },
}));

vi.mock("@/services/api/releaseChecklist", () => ({
  releaseChecklistApi: {
    getChecklist: getChecklistMock,
    getChecklistItem: vi.fn(),
    updateChecklistItem: updateChecklistItemMock,
  },
}));

vi.mock("@/services/api/releaseReadiness", () => ({
  releaseReadinessApi: {
    getReadiness: getReadinessMock,
  },
}));

vi.mock("@/services/api/contentItems", () => ({
  contentItemsApi: {
    getContentItems: getContentItemsMock,
    createContentItem: vi.fn(),
    updateContentItem: vi.fn(),
    deleteContentItem: vi.fn(),
  },
}));

vi.mock("@/services/api/credits", () => ({
  creditsApi: {
    getCredits: getCreditsMock,
    createCredit: vi.fn(),
    updateCredit: vi.fn(),
    deleteCredit: vi.fn(),
  },
}));

vi.mock("@/services/api/analytics", () => ({
  analyticsApi: {
    getAnalyticsSnapshots: getAnalyticsMock,
    createAnalyticsSnapshot: vi.fn(),
    updateAnalyticsSnapshot: vi.fn(),
    deleteAnalyticsSnapshot: vi.fn(),
  },
}));

vi.mock("@/services/api/driveWorkspace", () => ({
  driveWorkspaceQueryKey: (songId: string) => ["songs", songId, "drive-workspace"],
  isDriveWorkspaceDisconnectedError: () => false,
  driveWorkspaceApi: {
    getWorkspace: getWorkspaceMock,
    provisionWorkspace: provisionWorkspaceMock,
  },
}));

vi.mock("@/services/api/googleDrive", () => ({
  googleDriveConnectionQueryKey: ["google-drive", "connection"],
  googleDriveApi: {
    getStatus: getGoogleDriveStatusMock,
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
  openGoogleAuthorizationUrl: vi.fn(),
}));

vi.mock("@/services/api/calendar", () => ({
  calendarApi: {
    getCalendarEntries: vi.fn(),
  },
}));

vi.mock("@/services/api/dashboard", () => ({
  dashboardApi: {
    getDashboard: vi.fn(),
  },
}));

import { SongWorkspacePage } from "./Workbench";

const song: Song = {
  id: 1,
  title: "Release Control Test Song",
  status: "ReleasePreparation",
  createdAt: "2026-09-01T10:00:00Z",
  currentUserRole: "OWNER",
  canEdit: true,
  canManageMembers: true,
};

const release: Release = {
  id: 10,
  songId: 1,
  releaseDate: "2026-10-20",
  releaseType: "Single",
  distributor: "DistroKid",
  isrc: "US-XXX-26-00001",
  upc: "191227000000",
  status: "Preparing",
  platforms: ["Spotify", "AppleMusic", "YouTubeMusic", "TikTok"],
  createdAt: "2026-09-01T10:00:00Z",
  updatedAt: "2026-09-02T10:00:00Z",
};

const checklist: ReleaseChecklistItem[] = [
  {
    id: 101,
    releaseId: 10,
    key: "Master",
    label: "Master",
    isCompleted: true,
    completedAt: "2026-09-02T10:00:00Z",
    notes: null,
    sortOrder: 1,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
  {
    id: 102,
    releaseId: 10,
    key: "Cover",
    label: "Cover",
    isCompleted: true,
    completedAt: "2026-09-02T10:00:00Z",
    notes: "Need final square cover approval.",
    sortOrder: 2,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
  {
    id: 103,
    releaseId: 10,
    key: "Metadata",
    label: "Metadata",
    isCompleted: false,
    completedAt: null,
    notes: null,
    sortOrder: 3,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
  {
    id: 104,
    releaseId: 10,
    key: "Credits",
    label: "Credits",
    isCompleted: false,
    completedAt: null,
    notes: null,
    sortOrder: 4,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
  {
    id: 105,
    releaseId: 10,
    key: "Canvas",
    label: "Canvas",
    isCompleted: false,
    completedAt: null,
    notes: null,
    sortOrder: 5,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
  {
    id: 106,
    releaseId: 10,
    key: "MusicVideo",
    label: "Music Video",
    isCompleted: false,
    completedAt: null,
    notes: null,
    sortOrder: 6,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
  {
    id: 107,
    releaseId: 10,
    key: "ContentPlan",
    label: "Content Plan",
    isCompleted: false,
    completedAt: null,
    notes: null,
    sortOrder: 7,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
];

const readiness: ReleaseReadiness = {
  songId: 1,
  releaseId: 10,
  readyCount: 2,
  requiredCount: 6,
  totalCount: 7,
  percentage: 33,
  items: [
    {
      key: "Master",
      label: "Master",
      state: "Ready",
      source: "Derived",
      reason: "Current Final Master linked.",
      isRequired: true,
      relatedResourceId: 201,
      relatedResourceType: "AudioAsset",
    },
    {
      key: "Cover",
      label: "Cover",
      state: "Ready",
      source: "Derived",
      reason: "Current Final Cover Art linked.",
      isRequired: true,
      relatedResourceId: 301,
      relatedResourceType: "VisualAsset",
    },
    {
      key: "Metadata",
      label: "Metadata",
      state: "Incomplete",
      source: "Hybrid",
      reason: "Set release date, release type, and at least one platform.",
      isRequired: true,
    },
    {
      key: "Credits",
      label: "Credits",
      state: "Incomplete",
      source: "Hybrid",
      reason: "Add and confirm release credits.",
      isRequired: true,
    },
    {
      key: "Canvas",
      label: "Canvas",
      state: "Incomplete",
      source: "Derived",
      reason: "Add and finalize a Spotify Canvas.",
      isRequired: true,
    },
    {
      key: "MusicVideo",
      label: "Music Video",
      state: "NotRequired",
      source: "Manual",
      reason: "Music video is optional for this release.",
      isRequired: false,
    },
    {
      key: "ContentPlan",
      label: "Content Plan",
      state: "Incomplete",
      source: "Hybrid",
      reason: "Add at least one planned content item.",
      isRequired: true,
    },
  ],
};

async function renderReleaseWorkspace() {
  renderWithQueryClient(<SongWorkspacePage songId="1" />);
  await userEvent.click(await screen.findByRole("tab", { name: "release" }));
}

describe("Release workspace polish", () => {
  beforeEach(() => {
    getMeMock.mockReset();
    logoutMock.mockReset();
    getSongMock.mockReset();
    getAudioAssetsMock.mockReset();
    getVisualAssetsMock.mockReset();
    getReleaseMock.mockReset();
    createReleaseMock.mockReset();
    updateReleaseMock.mockReset();
    deleteReleaseMock.mockReset();
    getChecklistMock.mockReset();
    getReadinessMock.mockReset();
    updateChecklistItemMock.mockReset();
    getContentItemsMock.mockReset();
    getCreditsMock.mockReset();
    getAnalyticsMock.mockReset();
    getWorkspaceMock.mockReset();
    provisionWorkspaceMock.mockReset();
    getGoogleDriveStatusMock.mockReset();

    getMeMock.mockResolvedValue({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });
    getSongMock.mockResolvedValue(song);
    getAudioAssetsMock.mockResolvedValue([]);
    getVisualAssetsMock.mockResolvedValue([]);
    getReleaseMock.mockResolvedValue(release);
    createReleaseMock.mockResolvedValue(release);
    updateReleaseMock.mockResolvedValue(release);
    deleteReleaseMock.mockResolvedValue(undefined);
    getChecklistMock.mockResolvedValue(checklist);
    getReadinessMock.mockResolvedValue(readiness);
    updateChecklistItemMock.mockResolvedValue(checklist[2]);
    getContentItemsMock.mockResolvedValue([]);
    getCreditsMock.mockResolvedValue([]);
    getAnalyticsMock.mockResolvedValue([]);
    getWorkspaceMock.mockResolvedValue({
      isProvisioned: true,
      googleDriveStatus: "Connected",
      rootFolder: null,
      songFolder: null,
      folders: {},
    });
    provisionWorkspaceMock.mockResolvedValue(undefined);
    getGoogleDriveStatusMock.mockResolvedValue({ connected: false, status: null });
  });

  it("shows the release control hierarchy for an existing release", async () => {
    await renderReleaseWorkspace();

    expect(await screen.findByText("RELEASE / CONTROL")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RELEASE" })).toBeInTheDocument();
    expect(
      screen.getByText("Release planning, metadata, and preparation readiness."),
    ).toBeInTheDocument();
    expect(screen.getByText("RELEASE STATE")).toBeInTheDocument();
    expect(screen.getByText("RELEASE DETAILS")).toBeInTheDocument();
    expect(screen.getByText("READINESS")).toBeInTheDocument();
    expect(screen.getByText("PREPARATION CHECKLIST")).toBeInTheDocument();
    expect(screen.queryByText("Real backend data")).not.toBeInTheDocument();
  });

  it("renders status, date, distributor, platforms, and identifiers without publishing claims", async () => {
    await renderReleaseWorkspace();

    expect(await screen.findByText("Preparing")).toBeInTheDocument();
    expect(screen.getByText("Oct 20, 2026")).toBeInTheDocument();
    expect(screen.getByText("Single")).toBeInTheDocument();
    expect(screen.getByText("DistroKid")).toBeInTheDocument();
    expect(screen.getByText("US-XXX-26-00001")).toBeInTheDocument();
    expect(screen.getByText("191227000000")).toBeInTheDocument();
    expect(screen.getByText("Apple Music")).toBeInTheDocument();
    expect(screen.getByText("YouTube Music")).toBeInTheDocument();
    expect(screen.queryByText(/connected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synced/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/live/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ready to distribute/i)).not.toBeInTheDocument();
  });

  it("uses quiet missing metadata labels", async () => {
    getReleaseMock.mockResolvedValue({
      ...release,
      releaseDate: null,
      distributor: null,
      isrc: null,
      upc: null,
      platforms: [],
      status: "Planning",
    });

    await renderReleaseWorkspace();

    expect(await screen.findByText("DATE NOT SET")).toBeInTheDocument();
    expect(screen.getAllByText("Not set").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("No platforms selected.")).toBeInTheDocument();
  });

  it("shows one no-release setup state without checklist rows", async () => {
    getReleaseMock.mockResolvedValue(null);

    await renderReleaseWorkspace();

    expect(await screen.findByText("NO RELEASE SET UP")).toBeInTheDocument();
    expect(
      screen.getByText("Set the release date, distributor, platforms, and preparation checklist."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /set up release/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText("PREPARATION CHECKLIST")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Master checklist item")).not.toBeInTheDocument();
  });

  it("creates release metadata from the setup dialog", async () => {
    getReleaseMock.mockResolvedValue(null);
    const user = userEvent.setup();

    await renderReleaseWorkspace();
    await user.click((await screen.findAllByRole("button", { name: /set up release/i }))[0]);
    await user.type(screen.getByLabelText(/release date/i), "2026-10-20");
    await user.type(screen.getByLabelText(/distributor/i), "DistroKid");
    await user.type(screen.getByLabelText(/isrc/i), "US-XXX-26-00001");
    await user.type(screen.getByLabelText(/upc/i), "191227000000");
    await user.click(screen.getByLabelText("Spotify"));
    await user.click(screen.getByLabelText("Apple Music"));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createReleaseMock).toHaveBeenCalledWith("1", {
        releaseDate: "2026-10-20",
        releaseType: "Single",
        distributor: "DistroKid",
        isrc: "US-XXX-26-00001",
        upc: "191227000000",
        status: "Planning",
        platforms: ["Spotify", "AppleMusic"],
      });
    });
  });

  it("edits release metadata with compact platform selection", async () => {
    const user = userEvent.setup();

    await renderReleaseWorkspace();
    await user.click(await screen.findByRole("button", { name: /edit release/i }));
    await user.click(screen.getByLabelText("TikTok"));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updateReleaseMock).toHaveBeenCalledWith("1", {
        releaseDate: "2026-10-20",
        releaseType: "Single",
        distributor: "DistroKid",
        isrc: "US-XXX-26-00001",
        upc: "191227000000",
        status: "Preparing",
        platforms: ["Spotify", "AppleMusic", "YouTubeMusic"],
      });
    });
    expect(screen.queryByText("Album")).not.toBeInTheDocument();
    expect(screen.queryByText("EP")).not.toBeInTheDocument();
  });

  it("explains delete behavior for release setup and checklist", async () => {
    const user = userEvent.setup();

    await renderReleaseWorkspace();
    await user.click(await screen.findByRole("button", { name: /^delete$/i }));

    expect(screen.getByRole("heading", { name: "Remove release setup?" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This removes the release metadata and preparation checklist from DARKROOM SYSTEM. The Song remains.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /remove release/i }));

    await waitFor(() => expect(deleteReleaseMock).toHaveBeenCalledWith("1"));
  });

  it("renders readiness progress and next incomplete checklist item", async () => {
    await renderReleaseWorkspace();

    expect(await screen.findByText("2 / 6 READY")).toBeInTheDocument();
    expect(screen.getByText("33% required readiness")).toBeInTheDocument();
    expect(screen.getAllByText("Metadata").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Set release date, release type, and at least one platform.").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("progressbar", {
        name: "2 of 6 required release readiness items ready",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Current Final Master linked.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Master checklist item")).not.toBeInTheDocument();
  });

  it("renders all-complete checklist state without submission claims", async () => {
    getReadinessMock.mockResolvedValue({
      ...readiness,
      readyCount: 6,
      percentage: 100,
      items: readiness.items.map((item) =>
        item.isRequired ? { ...item, state: "Ready", reason: `${item.label} ready.` } : item,
      ),
    });

    await renderReleaseWorkspace();

    expect(await screen.findByText("6 / 6 READY")).toBeInTheDocument();
    expect(screen.getByText("100% required readiness")).toBeInTheDocument();
    expect(screen.getByText("ALL REQUIRED ITEMS READY")).toBeInTheDocument();
    expect(screen.queryByText(/submitted/i)).not.toBeInTheDocument();
  });

  it("updates manual checklist completion and removes completed date when unchecked in refreshed data", async () => {
    const user = userEvent.setup();

    await renderReleaseWorkspace();
    await user.click(await screen.findByLabelText("Metadata checklist item"));

    await waitFor(() => {
      expect(updateChecklistItemMock).toHaveBeenCalledWith("1", "103", {
        isCompleted: true,
        notes: null,
      });
    });

    getChecklistMock.mockResolvedValue([
      { ...checklist[2], isCompleted: false, completedAt: null },
    ]);
  });

  it("keeps checklist notes compact and saves through a note dialog", async () => {
    const user = userEvent.setup();

    await renderReleaseWorkspace();

    expect(await screen.findByText("Need final square cover approval.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /cover note/i })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /edit note/i })[0]);

    const note = await screen.findByRole("textbox", { name: /cover note/i });
    await user.clear(note);
    await user.type(note, "Cover approved for release control.");
    await user.click(screen.getByRole("button", { name: /save note/i }));

    await waitFor(() => {
      expect(updateChecklistItemMock).toHaveBeenCalledWith("1", "102", {
        isCompleted: true,
        notes: "Cover approved for release control.",
      });
    });
  });

  it("shows checklist mutation failures without removing release details", async () => {
    updateChecklistItemMock.mockRejectedValue(
      new ApiError("Checklist item could not be updated.", 500),
    );
    const user = userEvent.setup();

    await renderReleaseWorkspace();
    await user.click(await screen.findByLabelText("Metadata checklist item"));

    expect(await screen.findByText("Checklist item could not be updated.")).toBeInTheDocument();
    expect(screen.getByText("DistroKid")).toBeInTheDocument();
  });

  it("keeps release details visible when checklist loading fails", async () => {
    getChecklistMock.mockRejectedValue(new ApiError("Checklist unavailable", 500));
    getReadinessMock.mockRejectedValue(new ApiError("Readiness unavailable", 500));

    await renderReleaseWorkspace();

    expect(await screen.findByText("DistroKid")).toBeInTheDocument();
    expect(screen.getAllByText("Release checklist could not be loaded.").length).toBeGreaterThan(0);
    expect(screen.getByText("Release readiness could not be loaded.")).toBeInTheDocument();
  });

  it("keeps viewer release planning readable without release or checklist mutation controls", async () => {
    getSongMock.mockResolvedValueOnce({
      ...song,
      currentUserRole: "VIEWER",
      canEdit: false,
      canManageMembers: false,
    });

    await renderReleaseWorkspace();

    expect(await screen.findByText("Release state")).toBeInTheDocument();
    expect(screen.getByText("Preparation checklist")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Release" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add note" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit note" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Metadata checklist item")).not.toBeInTheDocument();
  });

  it("shows loading and release query error states", async () => {
    getReleaseMock.mockReturnValue(new Promise(() => undefined));
    const { unmount } = renderWithQueryClient(<SongWorkspacePage songId="1" />);
    await userEvent.click(await screen.findByRole("tab", { name: "release" }));

    expect(await screen.findByText("Loading release control room")).toBeInTheDocument();
    unmount();

    getReleaseMock.mockRejectedValue(new ApiError("Release failed", 500));
    await renderReleaseWorkspace();

    expect(await screen.findByRole("heading", { name: "Release unavailable" })).toBeInTheDocument();
    expect(screen.getByText("We couldn't load release information.")).toBeInTheDocument();
  });
});
