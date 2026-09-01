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
  createAudioAssetMock,
  updateAudioAssetMock,
  deleteAudioAssetMock,
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
  createAudioAssetMock: vi.fn(),
  updateAudioAssetMock: vi.fn(),
  deleteAudioAssetMock: vi.fn(),
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
    createAudioAsset: createAudioAssetMock,
    updateAudioAsset: updateAudioAssetMock,
    deleteAudioAsset: deleteAudioAssetMock,
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
    createAudioAssetMock.mockReset();
    updateAudioAssetMock.mockReset();
    deleteAudioAssetMock.mockReset();
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
    createAudioAssetMock.mockResolvedValue(metadataOnlyAudio);
    updateAudioAssetMock.mockResolvedValue(metadataOnlyAudio);
    deleteAudioAssetMock.mockResolvedValue(undefined);
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
    expect(await screen.findByText("ATTACH AUDIO FILE")).toBeInTheDocument();
    expect(screen.getByText("WAV, MP3, FLAC or M4A / up to 500 MB")).toBeInTheDocument();

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

    expect(await screen.findByText("FILE LINKED")).toBeInTheDocument();
    expect(screen.getAllByText("master.wav").length).toBeGreaterThan(0);
    expect(screen.getByText(/Google Drive/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open master.wav in drive/i })).toHaveAttribute(
      "href",
      "https://drive.google.test/file/91",
    );
    expect(screen.queryByRole("button", { name: /upload file/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/access-token/i)).not.toBeInTheDocument();
  });

  it("shows product upload guidance for backend failures without raw trace details", async () => {
    uploadAudioAssetFileMock.mockRejectedValue(
      new ApiError(
        '{"title":"Google Drive is not connected.","status":409,"traceId":"00-secret"}',
        409,
      ),
    );

    const { container } = renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await userEvent.click(await screen.findByRole("tab", { name: "audio" }));
    const file = new File(["data"], "demo.wav", { type: "audio/wav" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole("button", { name: /upload file/i }));

    expect(
      await screen.findByText("Connect storage from Settings before attaching audio files."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/traceId/i)).not.toBeInTheDocument();
  });

  it("uses one empty audio state instead of empty type panels or fake waveform copy", async () => {
    getAudioAssetsMock.mockResolvedValue([]);

    renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await userEvent.click(await screen.findByRole("tab", { name: "audio" }));

    expect(await screen.findByText("NO AUDIO ASSETS")).toBeInTheDocument();
    expect(screen.getByText("Start with a demo, recording, mix, or master.")).toBeInTheDocument();
    expect(screen.queryByText("Real backend data")).not.toBeInTheDocument();
    expect(screen.queryByText("Real metadata")).not.toBeInTheDocument();
    expect(screen.queryByText(/later milestone/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/waveform/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No demo metadata/i)).not.toBeInTheDocument();
  });

  it("shows populated audio type sections only", async () => {
    getAudioAssetsMock.mockResolvedValue([
      metadataOnlyAudio,
      {
        ...metadataOnlyAudio,
        id: 12,
        type: "Master",
        fileName: "final-master.wav",
        status: "Final",
        version: 2,
      },
    ]);

    renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await userEvent.click(await screen.findByRole("tab", { name: "audio" }));

    expect(await screen.findByRole("heading", { name: "Demo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Master" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recording" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Mix" })).not.toBeInTheDocument();
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
    expect(screen.getByText("LINKED")).toBeInTheDocument();
    expect(screen.getByText("FINAL")).toBeInTheDocument();
  });

  it("creates audio metadata without implying file upload happens in the dialog", async () => {
    getAudioAssetsMock.mockResolvedValue([]);
    const user = userEvent.setup();

    renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await user.click(await screen.findByRole("tab", { name: "audio" }));
    await user.click(await screen.findByRole("button", { name: /add audio asset/i }));
    await user.type(screen.getByLabelText(/asset file name/i), "new-demo.wav");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createAudioAssetMock).toHaveBeenCalledWith("1", {
        type: "Demo",
        fileName: "new-demo.wav",
        version: 1,
        status: "Draft",
        durationSeconds: null,
        fileSizeBytes: null,
        isCurrent: false,
      });
    });
    expect(screen.queryByText(/storage is not implemented/i)).not.toBeInTheDocument();
  });

  it("updates audio metadata from the edit dialog", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await user.click(await screen.findByRole("tab", { name: "audio" }));
    await user.click(await screen.findByRole("button", { name: /^edit$/i }));
    const input = screen.getByLabelText(/asset file name/i);
    await user.clear(input);
    await user.type(input, "edited-demo.wav");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updateAudioAssetMock).toHaveBeenCalledWith("1", "11", {
        type: "Demo",
        fileName: "edited-demo.wav",
        version: 1,
        status: "Draft",
        durationSeconds: 100,
        fileSizeBytes: 0,
        isCurrent: true,
      });
    });
  });

  it("explains delete behavior for linked and metadata-only audio assets", async () => {
    getAudioAssetsMock.mockResolvedValue([metadataOnlyAudio, { ...linkedAudio, id: 12 }]);
    const user = userEvent.setup();

    renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await user.click(await screen.findByRole("tab", { name: "audio" }));
    const deleteButtons = await screen.findAllByRole("button", { name: /delete/i });

    await user.click(deleteButtons[0]);
    expect(screen.getByText("This removes the asset from DARKROOM SYSTEM.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await user.click(deleteButtons[1]);
    expect(
      screen.getByText(
        "This removes the asset from DARKROOM SYSTEM. The linked Google Drive file will remain.",
      ),
    ).toBeInTheDocument();
  });

  it("shows Drive connection guidance instead of upload controls when disconnected", async () => {
    getGoogleDriveStatusMock.mockResolvedValue({
      connected: false,
      status: null,
    });

    renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await userEvent.click(await screen.findByRole("tab", { name: "audio" }));

    expect(await screen.findByText("CONNECT STORAGE TO UPLOAD")).toBeInTheDocument();
    expect(
      screen.getByText("Google Drive must be connected before attaching audio files."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open settings/i })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.queryByRole("button", { name: /upload file/i })).not.toBeInTheDocument();
  });

  it("shows reauthorization guidance instead of upload controls when Drive needs attention", async () => {
    getGoogleDriveStatusMock.mockResolvedValue({
      connected: true,
      status: "ReauthRequired",
    });

    renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await userEvent.click(await screen.findByRole("tab", { name: "audio" }));

    expect(await screen.findByText("STORAGE CONNECTION NEEDS ATTENTION")).toBeInTheDocument();
    expect(
      screen.getByText("Reconnect Google Drive from Settings before attaching audio files."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upload file/i })).not.toBeInTheDocument();
  });

  it("does not render an Open in Drive action when the linked file has no safe web link", async () => {
    getAudioAssetsMock.mockResolvedValue([
      {
        ...linkedAudio,
        linkedFile: linkedAudio.linkedFile
          ? { ...linkedAudio.linkedFile, webViewLink: null }
          : null,
      },
    ]);

    renderWithQueryClient(<SongWorkspacePage songId="1" />);

    await userEvent.click(await screen.findByRole("tab", { name: "audio" }));

    expect(await screen.findByText("FILE LINKED")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /open .* in drive/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/access-token/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/refresh-token/i)).not.toBeInTheDocument();
  });
});
