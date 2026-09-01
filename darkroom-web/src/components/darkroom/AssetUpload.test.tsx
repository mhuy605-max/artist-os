import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api/client";
import { renderWithQueryClient } from "@/test/render";
import type { AudioAsset, Song, VisualAsset } from "@/types";

const {
  getMeMock,
  logoutMock,
  getSongMock,
  getAudioAssetsMock,
  uploadAudioAssetFileMock,
  getVisualAssetsMock,
  uploadVisualAssetFileMock,
  getWorkspaceMock,
  provisionWorkspaceMock,
  getReleaseMock,
  getChecklistMock,
  getContentItemsMock,
  getCreditsMock,
  getAnalyticsMock,
  getGoogleDriveStatusMock,
} = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  logoutMock: vi.fn(),
  getSongMock: vi.fn(),
  getAudioAssetsMock: vi.fn(),
  uploadAudioAssetFileMock: vi.fn(),
  getVisualAssetsMock: vi.fn(),
  uploadVisualAssetFileMock: vi.fn(),
  getWorkspaceMock: vi.fn(),
  provisionWorkspaceMock: vi.fn(),
  getReleaseMock: vi.fn(),
  getChecklistMock: vi.fn(),
  getContentItemsMock: vi.fn(),
  getCreditsMock: vi.fn(),
  getAnalyticsMock: vi.fn(),
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
    children: React.ReactNode;
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
    uploadAudioAssetFile: uploadAudioAssetFileMock,
  },
}));

vi.mock("@/services/api/visualAssets", () => ({
  visualAssetsApi: {
    getVisualAssets: getVisualAssetsMock,
    uploadVisualAssetFile: uploadVisualAssetFileMock,
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

vi.mock("@/services/api/releases", () => ({
  releasesApi: {
    getRelease: getReleaseMock,
  },
}));

vi.mock("@/services/api/releaseChecklist", () => ({
  releaseChecklistQueryKey: (songId: string) => ["songs", songId, "release", "checklist"],
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
  title: "Night Protocol",
  status: "Demo",
  createdAt: "2026-08-31T10:00:00Z",
};

const metadataOnlyAudio: AudioAsset = {
  id: 11,
  songId: 1,
  type: "Demo",
  fileName: "metadata.wav",
  version: 1,
  status: "Draft",
  durationSeconds: 100,
  fileSizeBytes: 123,
  uploadedAt: "2026-08-31T10:00:00Z",
  isCurrent: true,
  linkedFile: null,
};

const linkedAudio: AudioAsset = {
  ...metadataOnlyAudio,
  fileName: "master.wav",
  fileSizeBytes: 4,
  linkedFile: {
    id: 91,
    provider: "GoogleDrive",
    resourceType: "AudioAssetFile",
    isFolder: false,
    displayName: "master.wav",
    mimeType: "audio/wav",
    sizeBytes: 4,
    webViewLink: "https://drive.google.test/file/91",
    createdAt: "2026-08-31T10:00:00Z",
    updatedAt: "2026-08-31T10:00:00Z",
  },
};

const metadataOnlyVisual: VisualAsset = {
  id: 21,
  songId: 1,
  type: "CoverArt",
  fileName: "cover.png",
  version: 1,
  status: "Draft",
  width: 1200,
  height: 1200,
  fileSizeBytes: 123,
  uploadedAt: "2026-08-31T10:00:00Z",
  isCurrent: true,
  linkedFile: null,
};

describe("Song workspace asset file upload", () => {
  beforeEach(() => {
    getMeMock.mockReset();
    logoutMock.mockReset();
    getSongMock.mockReset();
    getAudioAssetsMock.mockReset();
    uploadAudioAssetFileMock.mockReset();
    getVisualAssetsMock.mockReset();
    uploadVisualAssetFileMock.mockReset();
    getWorkspaceMock.mockReset();
    provisionWorkspaceMock.mockReset();
    getReleaseMock.mockReset();
    getChecklistMock.mockReset();
    getContentItemsMock.mockReset();
    getCreditsMock.mockReset();
    getAnalyticsMock.mockReset();
    getGoogleDriveStatusMock.mockReset();

    getMeMock.mockResolvedValue({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });
    getSongMock.mockResolvedValue(song);
    getAudioAssetsMock.mockResolvedValue([metadataOnlyAudio]);
    getVisualAssetsMock.mockResolvedValue([]);
    getWorkspaceMock.mockResolvedValue({
      isProvisioned: true,
      googleDriveStatus: "Connected",
      folders: {},
    });
    getGoogleDriveStatusMock.mockResolvedValue({
      connected: true,
      email: "artist.google@example.com",
      status: "Connected",
    });
    getReleaseMock.mockRejectedValue(new ApiError("Missing", 404));
    getChecklistMock.mockResolvedValue([]);
    getContentItemsMock.mockResolvedValue([]);
    getCreditsMock.mockResolvedValue([]);
    getAnalyticsMock.mockResolvedValue([]);
  });

  it("shows upload action for metadata-only audio asset and calls upload API", async () => {
    uploadAudioAssetFileMock.mockResolvedValue(linkedAudio);

    const { container } = renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await userEvent.click(await screen.findByRole("tab", { name: "audio" }));
    expect(await screen.findByText("No file linked")).toBeInTheDocument();

    const file = new File(["data"], "master.wav", { type: "audio/wav" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole("button", { name: /upload file/i }));

    await waitFor(() => {
      expect(uploadAudioAssetFileMock).toHaveBeenCalledWith("1", "11", file);
    });
  });

  it("renders linked file state and does not show overwrite upload button", async () => {
    getAudioAssetsMock.mockResolvedValue([linkedAudio]);

    renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await userEvent.click(await screen.findByRole("tab", { name: "audio" }));

    expect(await screen.findByText("File linked")).toBeInTheDocument();
    expect(screen.getAllByText("master.wav").length).toBeGreaterThan(0);
    expect(screen.getByText(/GoogleDrive/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open in drive/i })).toHaveAttribute(
      "href",
      "https://drive.google.test/file/91",
    );
    expect(screen.queryByRole("button", { name: /upload file/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/access-token/i)).not.toBeInTheDocument();
  });

  it("shows backend upload failure", async () => {
    uploadAudioAssetFileMock.mockRejectedValue(new ApiError("Unsupported audio file", 400));

    const { container } = renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await userEvent.click(await screen.findByRole("tab", { name: "audio" }));
    const file = new File(["data"], "demo.wav", { type: "audio/wav" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole("button", { name: /upload file/i }));

    expect(await screen.findByText("Unsupported audio file")).toBeInTheDocument();
  });
});
