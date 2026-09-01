import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api/client";
import type {
  AnalyticsSnapshot,
  AudioAsset,
  ContentItem,
  Credit,
  DriveWorkspace,
  Release,
  ReleaseChecklistItem,
  Song,
  VisualAsset,
} from "@/types";
import { renderWithQueryClient } from "@/test/render";

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
  getWorkspaceMock,
  provisionWorkspaceMock,
  getGoogleDriveStatusMock,
  DriveWorkspaceDisconnectedErrorMock,
} = vi.hoisted(() => {
  class DriveWorkspaceDisconnectedErrorMock extends Error {
    constructor() {
      super("Google Drive is not connected.");
      this.name = "DriveWorkspaceDisconnectedError";
    }
  }

  return {
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
    getWorkspaceMock: vi.fn(),
    provisionWorkspaceMock: vi.fn(),
    getGoogleDriveStatusMock: vi.fn(),
    DriveWorkspaceDisconnectedErrorMock,
  };
});

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
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/songs/7" }),
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
  },
}));

vi.mock("@/services/api/visualAssets", () => ({
  visualAssetsApi: {
    getVisualAssets: getVisualAssetsMock,
  },
}));

vi.mock("@/services/api/releases", () => ({
  releasesApi: {
    getRelease: getReleaseMock,
  },
}));

vi.mock("@/services/api/releaseChecklist", () => ({
  releaseChecklistApi: {
    getChecklist: getChecklistMock,
  },
}));

vi.mock("@/services/api/contentItems", () => ({
  contentItemsApi: {
    getContentItems: getContentItemsMock,
  },
}));

vi.mock("@/services/api/credits", () => ({
  creditsApi: {
    getCredits: getCreditsMock,
  },
}));

vi.mock("@/services/api/analytics", () => ({
  analyticsApi: {
    getAnalyticsSnapshots: getAnalyticsMock,
  },
}));

vi.mock("@/services/api/googleDrive", () => ({
  googleDriveConnectionQueryKey: ["google-drive", "connection"],
  googleDriveApi: {
    getStatus: getGoogleDriveStatusMock,
  },
  openGoogleAuthorizationUrl: vi.fn(),
}));

vi.mock("@/services/api/driveWorkspace", () => ({
  driveWorkspaceQueryKey: (songId: string) => ["songs", songId, "drive-workspace"],
  driveWorkspaceApi: {
    getWorkspace: getWorkspaceMock,
    provisionWorkspace: provisionWorkspaceMock,
  },
  isDriveWorkspaceDisconnectedError: (error: unknown) =>
    error instanceof DriveWorkspaceDisconnectedErrorMock,
}));

vi.mock("@/services/api/dashboard", () => ({
  dashboardApi: {
    getDashboard: vi.fn(),
  },
}));

vi.mock("@/services/api/calendar", () => ({
  calendarApi: {
    getCalendarEntries: vi.fn(),
  },
}));

import { SongWorkspacePage } from "./Workbench";

const song: Song = {
  id: 7,
  title: "Night Protocol",
  status: "Mixing",
  createdAt: "2026-09-01T10:00:00Z",
};

const longTitleSong: Song = {
  ...song,
  title:
    "Sprint Three Overview Long Title For A Song Workspace That Needs Natural Wrapping On Every Viewport",
};

const audioAsset: AudioAsset = {
  id: 1,
  songId: 7,
  type: "Demo",
  fileName: "demo.wav",
  version: 1,
  status: "Draft",
  uploadedAt: "2026-09-01T10:00:00Z",
  isCurrent: true,
  linkedFile: null,
};

const visualAsset: VisualAsset = {
  id: 2,
  songId: 7,
  type: "CoverArt",
  fileName: "cover.png",
  version: 1,
  status: "Draft",
  uploadedAt: "2026-09-01T10:00:00Z",
  isCurrent: true,
  linkedFile: null,
};

const release: Release = {
  id: 3,
  songId: 7,
  releaseDate: "2026-10-10",
  releaseType: "Single",
  status: "Preparing",
  platforms: ["YouTube"],
  createdAt: "2026-09-01T10:00:00Z",
  updatedAt: "2026-09-01T10:00:00Z",
};

const checklist: ReleaseChecklistItem[] = [
  {
    id: 4,
    releaseId: 3,
    key: "Master",
    label: "Master",
    isCompleted: true,
    sortOrder: 1,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
  {
    id: 5,
    releaseId: 3,
    key: "Cover",
    label: "Cover",
    isCompleted: false,
    sortOrder: 2,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
];

const contentItem: ContentItem = {
  id: 6,
  songId: 7,
  title: "Teaser cutdown",
  type: "Teaser",
  status: "Scheduled",
  dueDate: "2099-01-01",
  scheduledAt: null,
  publishedAt: null,
  createdAt: "2026-09-01T10:00:00Z",
  updatedAt: "2026-09-01T10:00:00Z",
};

const credit: Credit = {
  id: 7,
  songId: 7,
  contributorName: "Vera Sol",
  role: "Producer",
  status: "Confirmed",
  createdAt: "2026-09-01T10:00:00Z",
  updatedAt: "2026-09-01T10:00:00Z",
};

const analyticsSnapshot: AnalyticsSnapshot = {
  id: 8,
  songId: 7,
  platform: "YouTube",
  snapshotDate: "2026-09-01",
  views: 100,
  likes: 10,
  comments: 1,
  watchTimeMinutes: 30,
  subscribersGained: 2,
  createdAt: "2026-09-01T10:00:00Z",
};

const provisionedWorkspace: DriveWorkspace = {
  isProvisioned: true,
  googleDriveStatus: "Connected",
  songFolder: {
    name: "Night Protocol",
    externalId: "folder-1",
    resourceType: "SongFolder",
  },
  folders: {
    audio: { name: "Audio", externalId: "folder-2", resourceType: "AudioFolder" },
    visuals: { name: "Visuals", externalId: "folder-3", resourceType: "VisualsFolder" },
    release: { name: "Release", externalId: "folder-4", resourceType: "ReleaseFolder" },
    content: { name: "Content", externalId: "folder-5", resourceType: "ContentFolder" },
  },
};

function setDefaultMocks() {
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
  getAnalyticsMock.mockResolvedValue([]);
  getGoogleDriveStatusMock.mockResolvedValue({ connected: false });
  getWorkspaceMock.mockResolvedValue({ isProvisioned: false, folders: {} });
  provisionWorkspaceMock.mockResolvedValue(provisionedWorkspace);
}

describe("Song workspace Overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDefaultMocks();
  });

  it("renders project identity and an empty workspace summary from real Song data", async () => {
    renderWithQueryClient(<SongWorkspacePage songId="7" />);

    expect(await screen.findByRole("heading", { name: "Night Protocol" })).toBeInTheDocument();
    expect(screen.getByText("Songs / Project")).toBeInTheDocument();
    expect(screen.getAllByText("Mixing").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Created Sep 01, 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /projects/i })).toHaveAttribute("href", "/songs");
    expect(await screen.findByText("Add the first audio asset")).toBeInTheDocument();
    expect(screen.getAllByText("No assets").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Not set up").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("No credits")).toBeInTheDocument();
    expect(screen.getByText("No snapshots")).toBeInTheDocument();
  });

  it("renders long Song titles without falling back to fake project metadata", async () => {
    getSongMock.mockResolvedValue(longTitleSong);

    renderWithQueryClient(<SongWorkspacePage songId="7" />);

    expect(await screen.findByRole("heading", { name: longTitleSong.title })).toBeInTheDocument();
    expect(screen.queryByText(/BPM/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mock/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Real \+ mock/i)).not.toBeInTheDocument();
  });

  it("summarizes populated workspace areas and release readiness", async () => {
    getSongMock.mockResolvedValue({ ...song, status: "ReleasePreparation" });
    getAudioAssetsMock.mockResolvedValue([audioAsset, { ...audioAsset, id: 11 }]);
    getVisualAssetsMock.mockResolvedValue([visualAsset]);
    getReleaseMock.mockResolvedValue(release);
    getChecklistMock.mockResolvedValue(checklist);
    getContentItemsMock.mockResolvedValue([contentItem, { ...contentItem, id: 12 }]);
    getCreditsMock.mockResolvedValue([credit, { ...credit, id: 13, role: "Songwriter" }]);
    getAnalyticsMock.mockResolvedValue([analyticsSnapshot, { ...analyticsSnapshot, id: 14 }]);

    renderWithQueryClient(<SongWorkspacePage songId="7" />);

    expect(await screen.findByText("2 assets")).toBeInTheDocument();
    expect(screen.getByText("1 asset")).toBeInTheDocument();
    expect(screen.getAllByText("Preparing").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByText("1 contributor")).toBeInTheDocument();
    expect(screen.getByText("2 snapshots")).toBeInTheDocument();
    expect(
      await screen.findByRole("status", { name: "1 of 2 release checklist items complete" }),
    ).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Cover")).toBeInTheDocument();
  });

  it("uses workspace area buttons as tab navigation", async () => {
    renderWithQueryClient(<SongWorkspacePage songId="7" />);

    await userEvent.click(await screen.findByRole("button", { name: "Open Audio tab" }));

    expect(screen.getByRole("tab", { name: "audio" })).toHaveAttribute("aria-selected", "true");
  });

  it("renders Drive disconnected as intentional project storage state", async () => {
    renderWithQueryClient(<SongWorkspacePage songId="7" />);

    expect(await screen.findByText("Google Drive is not connected.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(getWorkspaceMock).not.toHaveBeenCalled();
  });

  it("treats the known Drive workspace disconnected 409 as storage disconnected", async () => {
    getGoogleDriveStatusMock.mockResolvedValue({ connected: true, status: "Connected" });
    getWorkspaceMock.mockRejectedValue(new DriveWorkspaceDisconnectedErrorMock());

    renderWithQueryClient(<SongWorkspacePage songId="7" />);

    expect(await screen.findByText("Google Drive is not connected.")).toBeInTheDocument();
    expect(screen.queryByText("Project storage could not be checked.")).not.toBeInTheDocument();
  });

  it("renders Drive connected and unprovisioned state with a setup action", async () => {
    getGoogleDriveStatusMock.mockResolvedValue({ connected: true, status: "Connected" });
    getWorkspaceMock.mockResolvedValue({ isProvisioned: false, folders: {} });

    renderWithQueryClient(<SongWorkspacePage songId="7" />);

    expect(await screen.findByText("Storage is connected")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Set up project storage" }));

    expect(provisionWorkspaceMock).toHaveBeenCalledWith("7");
  });

  it("renders Drive provisioned state without exposing folder ids", async () => {
    getGoogleDriveStatusMock.mockResolvedValue({ connected: true, status: "Connected" });
    getWorkspaceMock.mockResolvedValue(provisionedWorkspace);

    renderWithQueryClient(<SongWorkspacePage songId="7" />);

    expect(await screen.findByText("Ready")).toBeInTheDocument();
    expect(screen.getAllByText("Audio").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("folder-1")).not.toBeInTheDocument();
  });

  it("keeps Overview usable when a secondary query fails", async () => {
    getAudioAssetsMock.mockRejectedValue(new Error("Audio unavailable"));

    renderWithQueryClient(<SongWorkspacePage songId="7" />);

    expect(await screen.findByRole("heading", { name: "Night Protocol" })).toBeInTheDocument();
    const audioButton = await screen.findByRole("button", { name: "Open Audio tab" });
    expect(within(audioButton).getByText("Unavailable")).toBeInTheDocument();
  });

  it("renders structured loading, unexpected Song error, and 404 states", async () => {
    getSongMock.mockReturnValueOnce(new Promise(() => {}));
    const loading = renderWithQueryClient(<SongWorkspacePage songId="7" />);
    expect(await screen.findByLabelText("Loading project workspace")).toBeInTheDocument();
    loading.unmount();

    getSongMock.mockRejectedValueOnce(new Error("Song failed"));
    const failed = renderWithQueryClient(<SongWorkspacePage songId="7" />);
    expect(await screen.findByText("Project unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    failed.unmount();

    getSongMock.mockRejectedValueOnce(new ApiError("Missing", 404));
    renderWithQueryClient(<SongWorkspacePage songId="7" />);
    expect(await screen.findByText("Project not found")).toBeInTheDocument();
    expect(screen.getByText("This project isn't available.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Projects" })).toHaveAttribute(
      "href",
      "/songs",
    );
  });
});
