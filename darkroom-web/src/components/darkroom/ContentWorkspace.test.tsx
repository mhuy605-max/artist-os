import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api/client";
import { renderWithQueryClient } from "@/test/render";
import type { ContentItem, Song } from "@/types";

const {
  getMeMock,
  logoutMock,
  getSongMock,
  getAudioAssetsMock,
  getVisualAssetsMock,
  getReleaseMock,
  getChecklistMock,
  getContentItemsMock,
  createContentItemMock,
  updateContentItemMock,
  deleteContentItemMock,
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
  getChecklistMock: vi.fn(),
  getContentItemsMock: vi.fn(),
  createContentItemMock: vi.fn(),
  updateContentItemMock: vi.fn(),
  deleteContentItemMock: vi.fn(),
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
  useLocation: () => ({ pathname: "/songs/2" }),
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
    uploadAudioAssetFile: vi.fn(),
  },
}));

vi.mock("@/services/api/visualAssets", () => ({
  visualAssetsApi: {
    getVisualAssets: getVisualAssetsMock,
    createVisualAsset: vi.fn(),
    updateVisualAsset: vi.fn(),
    deleteVisualAsset: vi.fn(),
    uploadVisualAssetFile: vi.fn(),
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
    createContentItem: createContentItemMock,
    updateContentItem: updateContentItemMock,
    deleteContentItem: deleteContentItemMock,
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
  id: 2,
  title: "Content Control Test Song",
  status: "ContentCampaign",
  createdAt: "2026-09-01T10:00:00Z",
};

const contentItems: ContentItem[] = [
  {
    id: 201,
    songId: 2,
    title: "Overdue teaser cut for a very long campaign title that should wrap cleanly",
    type: "Teaser",
    status: "InProduction",
    platform: "Instagram",
    ownerName: "Mira",
    dueDate: "2020-01-01",
    scheduledAt: null,
    publishedAt: null,
    notes: "Use the hook section and keep the caption draft short enough for quick artist review.",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
  {
    id: 202,
    songId: 2,
    title: "Launch day YouTube Short",
    type: "YouTubeShort",
    status: "Scheduled",
    platform: "YouTubeShorts",
    ownerName: null,
    dueDate: "2099-01-01",
    scheduledAt: "2099-01-03",
    publishedAt: null,
    notes: null,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
  {
    id: 203,
    songId: 2,
    title: "Published behind the scenes recap",
    type: "BehindTheScenes",
    status: "Published",
    platform: "TikTok",
    ownerName: "Jay",
    dueDate: "2020-01-01",
    scheduledAt: "2020-01-02",
    publishedAt: "2020-01-03",
    notes: "Already posted manually outside Artist OS.",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
];

async function renderContentWorkspace() {
  renderWithQueryClient(<SongWorkspacePage songId="2" />);
  await userEvent.click(await screen.findByRole("tab", { name: "content" }));
}

describe("Content workspace polish", () => {
  beforeEach(() => {
    getMeMock.mockReset();
    logoutMock.mockReset();
    getSongMock.mockReset();
    getAudioAssetsMock.mockReset();
    getVisualAssetsMock.mockReset();
    getReleaseMock.mockReset();
    getChecklistMock.mockReset();
    getContentItemsMock.mockReset();
    createContentItemMock.mockReset();
    updateContentItemMock.mockReset();
    deleteContentItemMock.mockReset();
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
    getReleaseMock.mockResolvedValue(null);
    getChecklistMock.mockResolvedValue([]);
    getContentItemsMock.mockResolvedValue(contentItems);
    createContentItemMock.mockResolvedValue(contentItems[0]);
    updateContentItemMock.mockResolvedValue(contentItems[0]);
    deleteContentItemMock.mockResolvedValue(undefined);
    getCreditsMock.mockResolvedValue([]);
    getAnalyticsMock.mockResolvedValue([]);
    getWorkspaceMock.mockResolvedValue({ isProvisioned: false, folders: {} });
    provisionWorkspaceMock.mockResolvedValue(undefined);
    getGoogleDriveStatusMock.mockResolvedValue({ connected: false, status: null });
  });

  it("shows the content production hierarchy", async () => {
    await renderContentWorkspace();

    expect(await screen.findByText("CONTENT / PRODUCTION")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CONTENT" })).toBeInTheDocument();
    expect(screen.getByText("SUMMARY")).toBeInTheDocument();
    expect(screen.getByText("CONTENT PIPELINE")).toBeInTheDocument();
    expect(screen.getByText("CONTENT ITEMS")).toBeInTheDocument();
    expect(screen.queryByText("Real backend data")).not.toBeInTheDocument();
  });

  it("derives summary counts and pipeline stages from real content items", async () => {
    await renderContentWorkspace();

    expect(await screen.findByText("TOTAL")).toBeInTheDocument();
    expect(screen.getByText("IN PRODUCTION")).toBeInTheDocument();
    expect(screen.getByText("SCHEDULED")).toBeInTheDocument();
    expect(screen.getByText("PUBLISHED")).toBeInTheDocument();
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Idea")).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();
    expect(screen.getAllByText("In Production").length).toBeGreaterThan(0);
    expect(screen.getByText("Editing")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getAllByText("Scheduled").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Published").length).toBeGreaterThan(0);
  });

  it("presents content items with wrapped title, metadata, notes preview, and honest dates", async () => {
    await renderContentWorkspace();

    expect(await screen.findByText(contentItems[0].title)).toBeInTheDocument();
    expect(screen.getByText("Teaser")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Owner: Mira")).toBeInTheDocument();
    expect(screen.getByText(/Overdue \/ Jan 01, 2020/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled \/ Jan 03, 2099/i)).toBeInTheDocument();
    expect(screen.getByText("Published Jan 03, 2020")).toBeInTheDocument();
    expect(screen.getByText(contentItems[0].notes!)).toBeInTheDocument();
    expect(screen.getByText("Owner: Not set")).toBeInTheDocument();
  });

  it("does not treat published items with old due dates as overdue production work", async () => {
    await renderContentWorkspace();

    const publishedCard = screen.getByText("Published behind the scenes recap").closest("article");

    expect(publishedCard).not.toBeNull();
    expect(publishedCard!).toHaveTextContent("Jan 01, 2020");
    expect(publishedCard!).not.toHaveTextContent("Overdue");
  });

  it("shows one empty content state", async () => {
    getContentItemsMock.mockResolvedValue([]);

    await renderContentWorkspace();

    expect(await screen.findByText("NO CONTENT PLANNED")).toBeInTheDocument();
    expect(
      screen.getByText("Plan teasers, clips, videos, and campaign content for this Song."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Idea / Planned / In Production")).not.toBeInTheDocument();
  });

  it("creates content metadata with supported fields only", async () => {
    getContentItemsMock.mockResolvedValue([]);
    const user = userEvent.setup();

    await renderContentWorkspace();
    await user.click((await screen.findAllByRole("button", { name: /add content/i }))[0]);
    await user.type(screen.getByLabelText(/^title$/i), "Snippet plan");
    await user.type(screen.getByLabelText(/^owner$/i), "AR");
    await user.type(screen.getByLabelText(/due date/i), "2099-01-01");
    await user.type(screen.getByLabelText(/scheduled date/i), "2099-01-03");
    await user.type(screen.getByLabelText(/notes/i), "Cut from second chorus.");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createContentItemMock).toHaveBeenCalledWith("2", {
        title: "Snippet plan",
        type: "Teaser",
        status: "Idea",
        platform: null,
        ownerName: "AR",
        dueDate: "2099-01-01",
        scheduledAt: "2099-01-03",
        publishedAt: null,
        notes: "Cut from second chorus.",
      });
    });
  });

  it("edits content metadata without adding publishing controls", async () => {
    const user = userEvent.setup();

    await renderContentWorkspace();
    await user.click((await screen.findAllByRole("button", { name: /^edit$/i }))[0]);
    const title = screen.getByLabelText(/^title$/i);
    await user.clear(title);
    await user.type(title, "Edited teaser plan");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updateContentItemMock).toHaveBeenCalledWith("2", "201", {
        title: "Edited teaser plan",
        type: "Teaser",
        status: "InProduction",
        platform: "Instagram",
        ownerName: "Mira",
        dueDate: "2020-01-01",
        scheduledAt: null,
        publishedAt: null,
        notes:
          "Use the hook section and keep the caption draft short enough for quick artist review.",
      });
    });
    expect(screen.queryByText(/upload media/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/publish now/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/connect account/i)).not.toBeInTheDocument();
  });

  it("explains delete behavior as Artist OS metadata only", async () => {
    const user = userEvent.setup();

    await renderContentWorkspace();
    await user.click((await screen.findAllByRole("button", { name: /^delete$/i }))[0]);

    expect(screen.getByRole("heading", { name: "Remove content item?" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This removes this ContentItem's planning metadata from DARKROOM SYSTEM. External social posts are not affected.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(deleteContentItemMock).toHaveBeenCalledWith("2", "201"));
  });

  it("shows loading and API error states with retry", async () => {
    getContentItemsMock.mockReturnValue(new Promise(() => undefined));
    const loading = renderWithQueryClient(<SongWorkspacePage songId="2" />);
    await userEvent.click(await screen.findByRole("tab", { name: "content" }));

    expect(await screen.findByLabelText("Loading content production")).toBeInTheDocument();
    loading.unmount();

    getContentItemsMock.mockRejectedValue(new ApiError("Content unavailable", 500));
    await renderContentWorkspace();

    expect(
      await screen.findByText("We couldn't load content production from Artist OS."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("does not render unsupported publishing or sync language", async () => {
    await renderContentWorkspace();

    expect(await screen.findByText("CONTENT / PRODUCTION")).toBeInTheDocument();
    expect(screen.queryByText(/publishing to/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/auto publish/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/posting/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/delivered/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/live sync/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synced/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/connected account/i)).not.toBeInTheDocument();
  });
});
