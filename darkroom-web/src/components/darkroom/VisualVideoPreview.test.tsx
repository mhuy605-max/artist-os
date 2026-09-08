import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api/client";
import type { MediaAccessResponse, VisualAsset } from "@/types";

import { VisualVideoPreview } from "./workbench/visuals/VisualVideoPreview";

const { getVisualMediaAccessMock } = vi.hoisted(() => ({
  getVisualMediaAccessMock: vi.fn(),
}));

vi.mock("@/services/api/visualAssets", () => ({
  visualAssetsApi: {
    getVisualMediaAccess: getVisualMediaAccessMock,
  },
}));

const baseVideo: VisualAsset = {
  id: 22,
  songId: 1,
  assetFamilyId: "visual-family-1",
  type: "MusicVideo",
  fileName: "official-video-v1.mp4",
  version: 1,
  status: "Review",
  width: 1920,
  height: 1080,
  fileSizeBytes: 34_500_000,
  uploadedAt: "2026-09-07T10:00:00Z",
  isCurrent: true,
  linkedFile: {
    id: 92,
    provider: "GoogleDrive",
    resourceType: "VisualAssetFile",
    isFolder: false,
    displayName: "official-video-v1.mp4",
    mimeType: "video/mp4",
    sizeBytes: 34_500_000,
    webViewLink: "https://drive.google.test/file/92",
    createdAt: "2026-09-07T10:00:00Z",
    updatedAt: "2026-09-07T10:00:00Z",
  },
};

const secondVideo: VisualAsset = {
  ...baseVideo,
  id: 23,
  fileName: "vertical-teaser.webm",
  linkedFile: baseVideo.linkedFile
    ? {
        ...baseVideo.linkedFile,
        id: 93,
        displayName: "vertical-teaser.webm",
        mimeType: "video/webm",
        webViewLink: "https://drive.google.test/file/93",
      }
    : null,
};

function access(overrides: Partial<MediaAccessResponse> = {}): MediaAccessResponse {
  return {
    mediaUrl: "http://localhost:5178/api/songs/1/visual-assets/22/media?token=signed-media-token",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    mimeType: "video/mp4",
    fileName: "official-video-v1.mp4",
    sizeBytes: 34_500_000,
    ...overrides,
  };
}

function visual(overrides: Partial<VisualAsset> = {}): VisualAsset {
  return {
    ...baseVideo,
    ...overrides,
    linkedFile: overrides.linkedFile === undefined ? baseVideo.linkedFile : overrides.linkedFile,
  };
}

function linkedVideo(
  displayName: string,
  mimeType?: string | null,
  overrides: Partial<VisualAsset> = {},
): VisualAsset {
  return visual({
    fileName: displayName,
    ...overrides,
    linkedFile: {
      ...baseVideo.linkedFile!,
      displayName,
      mimeType,
    },
  });
}

function linkedImage(): VisualAsset {
  return visual({
    type: "CoverArt",
    fileName: "cover-final.png",
    linkedFile: {
      ...baseVideo.linkedFile!,
      displayName: "cover-final.png",
      mimeType: "image/png",
    },
  });
}

function renderVideoPreview(asset: VisualAsset = baseVideo) {
  return render(
    <VisualVideoPreview
      songId="1"
      asset={asset}
      isActive
      onActivate={vi.fn()}
      onDeactivate={vi.fn()}
    />,
  );
}

function renderCoordinatedVideos(assets: VisualAsset[] = [baseVideo, secondVideo]) {
  function Wrapper() {
    const [activeVideoAssetId, setActiveVideoAssetId] = useState<string | null>(null);

    return (
      <>
        {assets.map((asset) => {
          const assetId = String(asset.id);
          return (
            <VisualVideoPreview
              key={asset.id}
              songId="1"
              asset={asset}
              isActive={activeVideoAssetId === assetId}
              onActivate={() => setActiveVideoAssetId(assetId)}
              onDeactivate={() =>
                setActiveVideoAssetId((current) => (current === assetId ? null : current))
              }
            />
          );
        })}
      </>
    );
  }

  return render(<Wrapper />);
}

function videoElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll("video"));
}

async function findVideoElement(container: HTMLElement) {
  await waitFor(() => {
    expect(videoElements(container)[0]).toBeTruthy();
  });
  return videoElements(container)[0] as HTMLMediaElement;
}

describe("Visual video preview", () => {
  let playMock: ReturnType<typeof vi.fn>;
  let pauseMock: ReturnType<typeof vi.fn>;
  let loadMock: ReturnType<typeof vi.fn>;
  let currentTimeByElement: WeakMap<HTMLMediaElement, number>;
  let durationByElement: WeakMap<HTMLMediaElement, number>;

  beforeEach(() => {
    vi.clearAllMocks();
    currentTimeByElement = new WeakMap();
    durationByElement = new WeakMap();
    playMock = vi.fn().mockResolvedValue(undefined);
    pauseMock = vi.fn();
    loadMock = vi.fn();

    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: playMock,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: pauseMock,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value: loadMock,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
      configurable: true,
      get() {
        return currentTimeByElement.get(this) ?? 0;
      },
      set(value: number) {
        currentTimeByElement.set(this, value);
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      configurable: true,
      get() {
        return durationByElement.get(this) ?? Number.NaN;
      },
    });

    getVisualMediaAccessMock.mockResolvedValue(access());
    sessionStorage.clear();
    localStorage.clear();
  });

  it("shows a video playback entry point for a linked video", () => {
    renderVideoPreview();

    expect(screen.getByRole("button", { name: /play official-video-v1.mp4/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/official-video-v1.mp4 video preview/i)).toBeInTheDocument();
  });

  it("does not show a real player for unlinked video assets", () => {
    renderVideoPreview(visual({ linkedFile: null }));

    expect(screen.queryByRole("button", { name: /play/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/video preview/i)).not.toBeInTheDocument();
  });

  it("does not render for image assets so image preview can own images", () => {
    renderVideoPreview(linkedImage());

    expect(screen.queryByLabelText(/video preview/i)).not.toBeInTheDocument();
    expect(getVisualMediaAccessMock).not.toHaveBeenCalled();
  });

  it("detects supported video extensions when MIME type is missing", () => {
    renderVideoPreview(linkedVideo("canvas-loop.mov", null, { type: "Visualizer" }));

    expect(screen.getByRole("button", { name: /play canvas-loop.mov/i })).toBeInTheDocument();
  });

  it("does not render a video element for unsupported visual files", () => {
    renderVideoPreview(linkedVideo("brand-guide.pdf", "application/pdf", { type: "PromoAsset" }));

    expect(screen.queryByLabelText(/video preview/i)).not.toBeInTheDocument();
  });

  it("does not autoplay or request media access before Play", () => {
    renderVideoPreview();

    expect(playMock).not.toHaveBeenCalled();
    expect(getVisualMediaAccessMock).not.toHaveBeenCalled();
  });

  it("requests media access on first Play and uses the signed Artist OS URL", async () => {
    const { container } = renderVideoPreview();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));

    await waitFor(() => {
      expect(getVisualMediaAccessMock).toHaveBeenCalledWith("1", "22");
    });
    expect(videoElements(container)[0].src).toBe(access().mediaUrl);
    expect(videoElements(container)[0].src).not.toContain("accessToken");
    expect(videoElements(container)[0].src).not.toContain("jwt");
  });

  it("moves from Play to Pause after playback starts", async () => {
    renderVideoPreview();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));

    expect(
      await screen.findByRole("button", { name: /pause official-video-v1.mp4/i }),
    ).toBeInTheDocument();
  });

  it("pauses and resumes without requesting fresh non-expired access", async () => {
    renderVideoPreview();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));
    await userEvent.click(
      await screen.findByRole("button", { name: /pause official-video-v1.mp4/i }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: /play official-video-v1.mp4/i }),
    );

    expect(pauseMock).toHaveBeenCalled();
    expect(playMock).toHaveBeenCalledTimes(2);
    expect(getVisualMediaAccessMock).toHaveBeenCalledTimes(1);
  });

  it("pauses the first video when a second linked video starts", async () => {
    renderCoordinatedVideos();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));
    await userEvent.click(screen.getByRole("button", { name: /play vertical-teaser.webm/i }));

    await waitFor(() => {
      expect(pauseMock).toHaveBeenCalled();
    });
    expect(
      await screen.findByRole("button", { name: /pause vertical-teaser.webm/i }),
    ).toBeInTheDocument();
  });

  it("displays native loaded metadata duration when available", async () => {
    const { container } = renderVideoPreview();
    const video = await findVideoElement(container);

    durationByElement.set(video, 242);
    fireEvent.loadedMetadata(video);

    expect(screen.getByText("0:00 / 4:02")).toBeInTheDocument();
  });

  it("updates elapsed time from native timeupdate events", async () => {
    const { container } = renderVideoPreview();
    const video = await findVideoElement(container);

    durationByElement.set(video, 242);
    currentTimeByElement.set(video, 84);
    fireEvent.loadedMetadata(video);
    fireEvent.timeUpdate(video);

    expect(screen.getByText("1:24 / 4:02")).toBeInTheDocument();
  });

  it("seeks by changing native currentTime", async () => {
    const { container } = renderVideoPreview();
    const video = await findVideoElement(container);

    durationByElement.set(video, 242);
    fireEvent.loadedMetadata(video);
    fireEvent.change(screen.getByRole("slider", { name: /seek official-video-v1.mp4/i }), {
      target: { value: "90" },
    });

    expect(video.currentTime).toBe(90);
    expect(screen.getByText("1:30 / 4:02")).toBeInTheDocument();
  });

  it("shows buffering from native waiting events", async () => {
    const { container } = renderVideoPreview();
    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));

    fireEvent.waiting(await findVideoElement(container));

    expect(await screen.findByText("Buffering")).toBeInTheDocument();
  });

  it("returns to paused state at the end of the video", async () => {
    const { container } = renderVideoPreview();
    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));

    fireEvent.ended(videoElements(container)[0]);

    expect(
      await screen.findByRole("button", { name: /play official-video-v1.mp4/i }),
    ).toBeInTheDocument();
  });

  it("shows a product error when media access fails", async () => {
    getVisualMediaAccessMock.mockRejectedValue(new Error("network down"));
    renderVideoPreview();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));

    expect(await screen.findByText("Could not load video.")).toBeInTheDocument();
  });

  it("shows reconnect guidance when media access reports reauth required", async () => {
    getVisualMediaAccessMock.mockRejectedValue(
      new ApiError('{"title":"Google Drive authorization needs to be refreshed."}', 409),
    );
    renderVideoPreview();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));

    expect(
      await screen.findByText("Reconnect Google Drive from Settings before previewing video."),
    ).toBeInTheDocument();
  });

  it("shows connect guidance when media access reports disconnected Drive", async () => {
    getVisualMediaAccessMock.mockRejectedValue(
      new ApiError('{"title":"Google Drive is not connected."}', 409),
    );
    renderVideoPreview();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));

    expect(
      await screen.findByText("Connect Google Drive from Settings before previewing video."),
    ).toBeInTheDocument();
  });

  it("shows codec/browser fallback on native video error", async () => {
    const { container } = renderVideoPreview();
    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));

    fireEvent.error(videoElements(container)[0]);

    expect(await screen.findByText("Playback not supported in this browser.")).toBeInTheDocument();
  });

  it("reacquires expired access after a native video error", async () => {
    getVisualMediaAccessMock
      .mockResolvedValueOnce(access({ expiresAt: new Date(Date.now() + 1_000).toISOString() }))
      .mockResolvedValueOnce(access({ mediaUrl: "http://localhost:5178/new-video?token=fresh" }));
    const { container } = renderVideoPreview();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));
    fireEvent.error(videoElements(container)[0]);

    await waitFor(() => {
      expect(getVisualMediaAccessMock).toHaveBeenCalledTimes(2);
    });
  });

  it("reacquires expired media access before a new playback attempt", async () => {
    getVisualMediaAccessMock
      .mockResolvedValueOnce(access({ expiresAt: new Date(Date.now() + 1_000).toISOString() }))
      .mockResolvedValueOnce(access({ mediaUrl: "http://localhost:5178/fresh-video?token=fresh" }));
    renderVideoPreview();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));
    await userEvent.click(
      await screen.findByRole("button", { name: /pause official-video-v1.mp4/i }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: /play official-video-v1.mp4/i }),
    );

    expect(getVisualMediaAccessMock).toHaveBeenCalledTimes(2);
  });

  it("reuses valid media access before a new playback attempt", async () => {
    renderVideoPreview();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));
    await userEvent.click(
      await screen.findByRole("button", { name: /pause official-video-v1.mp4/i }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: /play official-video-v1.mp4/i }),
    );

    expect(getVisualMediaAccessMock).toHaveBeenCalledTimes(1);
  });

  it("clears stale media access when the linked file changes", async () => {
    getVisualMediaAccessMock
      .mockResolvedValueOnce(access())
      .mockResolvedValueOnce(access({ mediaUrl: "http://localhost:5178/new-link?token=fresh" }));
    const rendered = render(
      <VisualVideoPreview
        songId="1"
        asset={baseVideo}
        isActive
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));
    rendered.rerender(
      <VisualVideoPreview
        songId="1"
        asset={visual({
          fileName: "official-video-v2.mp4",
          linkedFile: {
            ...baseVideo.linkedFile!,
            id: 94,
            displayName: "official-video-v2.mp4",
            mimeType: "video/mp4",
          },
        })}
        isActive
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: /play official-video-v2.mp4/i }),
    );

    expect(getVisualMediaAccessMock).toHaveBeenCalledTimes(2);
  });

  it("has accessible playback and seek controls", () => {
    renderVideoPreview();

    expect(screen.getByRole("button", { name: /play official-video-v1.mp4/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /seek official-video-v1.mp4/i })).toBeInTheDocument();
  });

  it("does not render download, version, transcoding, or poster controls", () => {
    renderVideoPreview();

    expect(screen.queryByRole("button", { name: /download/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new version/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/transcod/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/poster/i)).not.toBeInTheDocument();
  });

  it("does not persist signed media URLs in browser storage", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    renderVideoPreview();

    await userEvent.click(screen.getByRole("button", { name: /play official-video-v1.mp4/i }));

    expect(localStorageSpy).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.stringMatching(/token=/),
    );
    expect(sessionStorage.getItem("mediaUrl")).toBeNull();
    expect(localStorage.getItem("mediaUrl")).toBeNull();
  });
});
