import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api/client";
import { renderWithQueryClient } from "@/test/render";
import type { AnalyticsSnapshot, Song } from "@/types";

const {
  getMeMock,
  logoutMock,
  getSongMock,
  getAudioAssetsMock,
  getVisualAssetsMock,
  getReleaseMock,
  getChecklistMock,
  getContentItemsMock,
  getCreditsMock,
  getAnalyticsMock,
  createAnalyticsMock,
  updateAnalyticsMock,
  deleteAnalyticsMock,
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
  getChecklistMock: vi.fn(),
  getContentItemsMock: vi.fn(),
  getCreditsMock: vi.fn(),
  getAnalyticsMock: vi.fn(),
  createAnalyticsMock: vi.fn(),
  updateAnalyticsMock: vi.fn(),
  deleteAnalyticsMock: vi.fn(),
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
  useLocation: () => ({ pathname: "/songs/4" }),
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
    createRelease: vi.fn(),
    updateRelease: vi.fn(),
    deleteRelease: vi.fn(),
  },
}));

vi.mock("@/services/api/releaseChecklist", () => ({
  releaseChecklistApi: {
    getChecklist: getChecklistMock,
    getChecklistItem: vi.fn(),
    updateChecklistItem: vi.fn(),
  },
}));

vi.mock("@/services/api/contentItems", () => ({
  contentItemsApi: {
    getContentItems: getContentItemsMock,
    getContentItem: vi.fn(),
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
    createAnalyticsSnapshot: createAnalyticsMock,
    updateAnalyticsSnapshot: updateAnalyticsMock,
    deleteAnalyticsSnapshot: deleteAnalyticsMock,
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

import { SongWorkspacePage } from "./workbench/Workbench";

const song: Song = {
  id: 4,
  title: "Performance Log Test Song",
  status: "Analytics",
  createdAt: "2026-09-01T10:00:00Z",
  currentUserRole: "OWNER",
  canEdit: true,
  canManageMembers: true,
};

const snapshots: AnalyticsSnapshot[] = [
  {
    id: 401,
    songId: 4,
    platform: "YouTube",
    snapshotDate: "2026-09-01",
    views: 12500,
    likes: 1200,
    comments: 180,
    watchTimeMinutes: 4500,
    subscribersGained: 64,
    createdAt: "2026-09-01T12:00:00Z",
  },
  {
    id: 402,
    songId: 4,
    platform: "YouTube",
    snapshotDate: "2026-09-08",
    views: 15000,
    likes: 1400,
    comments: 210,
    watchTimeMinutes: 5200,
    subscribersGained: 70,
    createdAt: "2026-09-08T12:00:00Z",
  },
  {
    id: 403,
    songId: 4,
    platform: "Spotify",
    snapshotDate: "2026-09-05",
    views: 999999,
    likes: 0,
    comments: 0,
    watchTimeMinutes: 0,
    subscribersGained: 0,
    createdAt: "2026-09-05T12:00:00Z",
  },
];

async function renderAnalyticsWorkspace() {
  renderWithQueryClient(<SongWorkspacePage songId="4" />);
  await userEvent.click(await screen.findByRole("tab", { name: "analytics" }));
}

describe("Analytics workspace polish", () => {
  beforeEach(() => {
    getMeMock.mockReset();
    logoutMock.mockReset();
    getSongMock.mockReset();
    getAudioAssetsMock.mockReset();
    getVisualAssetsMock.mockReset();
    getReleaseMock.mockReset();
    getChecklistMock.mockReset();
    getContentItemsMock.mockReset();
    getCreditsMock.mockReset();
    getAnalyticsMock.mockReset();
    createAnalyticsMock.mockReset();
    updateAnalyticsMock.mockReset();
    deleteAnalyticsMock.mockReset();
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
    getReleaseMock.mockResolvedValue(null);
    getChecklistMock.mockResolvedValue([]);
    getContentItemsMock.mockResolvedValue([]);
    getCreditsMock.mockResolvedValue([]);
    getAnalyticsMock.mockResolvedValue(snapshots);
    createAnalyticsMock.mockResolvedValue(snapshots[0]);
    updateAnalyticsMock.mockResolvedValue(snapshots[0]);
    deleteAnalyticsMock.mockResolvedValue(undefined);
    getWorkspaceMock.mockResolvedValue({ isProvisioned: false, folders: {} });
    provisionWorkspaceMock.mockResolvedValue(undefined);
    getGoogleDriveStatusMock.mockResolvedValue({ connected: false, status: null });
  });

  it("shows the analytics performance hierarchy", async () => {
    await renderAnalyticsWorkspace();

    expect(await screen.findByText("ANALYTICS / PERFORMANCE")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ANALYTICS" })).toBeInTheDocument();
    expect(screen.getByText("LATEST PERFORMANCE")).toBeInTheDocument();
    expect(screen.getByText("PERFORMANCE HISTORY")).toBeInTheDocument();
    expect(screen.queryByText("Real backend data")).not.toBeInTheDocument();
    expect(screen.queryByText("Views over time")).not.toBeInTheDocument();
  });

  it("selects the latest recorded snapshot per platform", async () => {
    await renderAnalyticsWorkspace();

    expect(
      await screen.findByText("Latest recorded snapshot date: Sep 08, 2026"),
    ).toBeInTheDocument();
    expect(screen.getByText("Latest recorded snapshot date: Sep 05, 2026")).toBeInTheDocument();
    expect(screen.getAllByText("15,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("999,999").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5,200 minutes").length).toBeGreaterThan(0);
  });

  it("shows chronological history with same-platform changes only", async () => {
    await renderAnalyticsWorkspace();

    const first = await screen.findByText("Sep 01, 2026");
    const spotify = screen.getByText("Sep 05, 2026");
    const second = screen.getByText("Sep 08, 2026");

    expect(first.compareDocumentPosition(spotify) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(spotify.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByText("First recorded snapshot").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("+2,500 since previous snapshot")).toBeInTheDocument();
    expect(screen.queryByText(/Spotify views gained from YouTube/i)).not.toBeInTheDocument();
  });

  it("filters history by recorded platform", async () => {
    const user = userEvent.setup();

    await renderAnalyticsWorkspace();
    await user.click(await screen.findByRole("button", { name: "YouTube" }));

    const historyPanel = screen
      .getByRole("heading", { name: "Performance history" })
      .closest("section");
    expect(historyPanel).not.toBeNull();
    expect(within(historyPanel!).getAllByText("YouTube").length).toBeGreaterThan(0);
    expect(within(historyPanel!).queryByText("Sep 05, 2026")).not.toBeInTheDocument();
  });

  it("shows one focused empty analytics state without fake charts", async () => {
    getAnalyticsMock.mockResolvedValue([]);

    await renderAnalyticsWorkspace();

    expect(await screen.findByText("NO PERFORMANCE SNAPSHOTS")).toBeInTheDocument();
    expect(screen.getByText("Start recording performance data for this song.")).toBeInTheDocument();
    expect(screen.queryByText("0 views")).not.toBeInTheDocument();
    expect(screen.queryByText("Views over time")).not.toBeInTheDocument();
  });

  it("creates a performance snapshot with supported fields only", async () => {
    getAnalyticsMock.mockResolvedValue([]);
    const user = userEvent.setup();

    await renderAnalyticsWorkspace();
    await user.click((await screen.findAllByRole("button", { name: /add snapshot/i }))[0]);
    await user.type(screen.getByLabelText(/snapshot date/i), "2026-09-10");
    await user.clear(screen.getByLabelText(/^views$/i));
    await user.type(screen.getByLabelText(/^views$/i), "1250000");
    await user.clear(screen.getByLabelText(/^likes$/i));
    await user.type(screen.getByLabelText(/^likes$/i), "12");
    await user.clear(screen.getByLabelText(/^comments$/i));
    await user.type(screen.getByLabelText(/^comments$/i), "3");
    await user.clear(screen.getByLabelText(/watch time minutes/i));
    await user.type(screen.getByLabelText(/watch time minutes/i), "7000");
    await user.clear(screen.getByLabelText(/subscribers gained/i));
    await user.type(screen.getByLabelText(/subscribers gained/i), "0");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createAnalyticsMock).toHaveBeenCalledWith("4", {
        platform: "YouTube",
        snapshotDate: "2026-09-10",
        views: 1250000,
        likes: 12,
        comments: 3,
        watchTimeMinutes: 7000,
        subscribersGained: 0,
      });
    });
  });

  it("edits snapshot metadata and shows duplicate-date conflicts as product copy", async () => {
    const user = userEvent.setup();
    updateAnalyticsMock.mockRejectedValueOnce(new ApiError("Conflict", 409));

    await renderAnalyticsWorkspace();
    const youtubeRow = (await screen.findByText("Sep 08, 2026")).closest("article");
    expect(youtubeRow).not.toBeNull();
    await user.click(within(youtubeRow!).getByRole("button", { name: /^edit$/i }));
    await user.clear(screen.getByLabelText(/^views$/i));
    await user.type(screen.getByLabelText(/^views$/i), "16000");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText("A snapshot already exists for this platform and snapshot date."),
    ).toBeInTheDocument();
    expect(updateAnalyticsMock).toHaveBeenCalledWith("4", "402", {
      platform: "YouTube",
      snapshotDate: "2026-09-08",
      views: 16000,
      likes: 1400,
      comments: 210,
      watchTimeMinutes: 5200,
      subscribersGained: 70,
    });
  });

  it("validates required date and non-negative whole metrics before saving", async () => {
    getAnalyticsMock.mockResolvedValue([]);
    const user = userEvent.setup();

    await renderAnalyticsWorkspace();
    await user.click((await screen.findAllByRole("button", { name: /add snapshot/i }))[0]);
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Snapshot date is required.")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/snapshot date/i), "2026-09-10");
    await user.clear(screen.getByLabelText(/^views$/i));
    await user.type(screen.getByLabelText(/^views$/i), "-1");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText("Metrics must be non-negative whole numbers."),
    ).toBeInTheDocument();
    expect(createAnalyticsMock).not.toHaveBeenCalled();
  });

  it("explains delete behavior as stored performance data only", async () => {
    const user = userEvent.setup();

    await renderAnalyticsWorkspace();
    const youtubeRow = (await screen.findByText("Sep 08, 2026")).closest("article");
    expect(youtubeRow).not.toBeNull();
    await user.click(within(youtubeRow!).getByRole("button", { name: /^delete$/i }));

    expect(
      screen.getByRole("heading", { name: "Remove performance snapshot?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This removes the recorded performance data from DARKROOM SYSTEM. External platform analytics are not affected.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(deleteAnalyticsMock).toHaveBeenCalledWith("4", "402"));
  });

  it("shows loading and API error states with retry", async () => {
    getAnalyticsMock.mockReturnValue(new Promise(() => undefined));
    const loading = renderWithQueryClient(<SongWorkspacePage songId="4" />);
    await userEvent.click(await screen.findByRole("tab", { name: "analytics" }));

    expect(await screen.findByLabelText("Loading performance snapshots")).toBeInTheDocument();
    loading.unmount();

    getAnalyticsMock.mockRejectedValue(new ApiError("Analytics unavailable", 500));
    await renderAnalyticsWorkspace();

    expect(
      await screen.findByText("We couldn't load recorded performance snapshots from Artist OS."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("keeps viewer performance snapshots readable without analytics mutation controls", async () => {
    getSongMock.mockResolvedValueOnce({
      ...song,
      currentUserRole: "VIEWER",
      canEdit: false,
      canManageMembers: false,
    });

    await renderAnalyticsWorkspace();

    expect(await screen.findByText("Latest performance")).toBeInTheDocument();
    expect(screen.getAllByText("YouTube").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /add snapshot/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^delete$/i })).not.toBeInTheDocument();
  });

  it("does not render unsupported live, synced, import, or API-status controls", async () => {
    await renderAnalyticsWorkspace();

    expect(await screen.findByText("ANALYTICS / PERFORMANCE")).toBeInTheDocument();
    expect(screen.queryByText(/live/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synced/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/auto sync/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/last sync/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/import from spotify/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/refresh from youtube/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/api status/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /import/i })).not.toBeInTheDocument();
  });
});
