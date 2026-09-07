import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api/client";
import type { MediaAccessResponse, VisualAsset } from "@/types";

import { VisualImagePreview } from "./workbench/visuals/VisualImagePreview";

const { getVisualMediaAccessMock } = vi.hoisted(() => ({
  getVisualMediaAccessMock: vi.fn(),
}));

vi.mock("@/services/api/visualAssets", () => ({
  visualAssetsApi: {
    getVisualMediaAccess: getVisualMediaAccessMock,
  },
}));

const baseVisual: VisualAsset = {
  id: 22,
  songId: 1,
  type: "CoverArt",
  fileName: "cover-final.png",
  version: 2,
  status: "Final",
  width: 3000,
  height: 3000,
  fileSizeBytes: 8_808_038,
  uploadedAt: "2026-08-31T10:00:00Z",
  isCurrent: true,
  linkedFile: {
    id: 92,
    provider: "GoogleDrive",
    resourceType: "VisualAssetFile",
    isFolder: false,
    displayName: "cover-final.png",
    mimeType: "image/png",
    sizeBytes: 8_808_038,
    webViewLink: "https://drive.google.test/file/92",
    createdAt: "2026-08-31T10:00:00Z",
    updatedAt: "2026-08-31T10:00:00Z",
  },
};

function access(overrides: Partial<MediaAccessResponse> = {}): MediaAccessResponse {
  return {
    mediaUrl: "http://localhost:5178/api/songs/1/visual-assets/22/media?token=signed-media-token",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    mimeType: "image/png",
    fileName: "cover-final.png",
    sizeBytes: 8_808_038,
    ...overrides,
  };
}

function visual(overrides: Partial<VisualAsset> = {}): VisualAsset {
  return {
    ...baseVisual,
    ...overrides,
    linkedFile: overrides.linkedFile === undefined ? baseVisual.linkedFile : overrides.linkedFile,
  };
}

function linkedVisual(
  displayName: string,
  mimeType?: string | null,
  overrides: Partial<VisualAsset> = {},
): VisualAsset {
  return visual({
    fileName: displayName,
    ...overrides,
    linkedFile: {
      ...baseVisual.linkedFile!,
      displayName,
      mimeType,
    },
  });
}

async function renderedImage(name = /cover-final.png preview/i) {
  return await screen.findByRole("img", { name });
}

describe("Visual image preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVisualMediaAccessMock.mockResolvedValue(access());
    sessionStorage.clear();
    localStorage.clear();
  });

  it("does not show a preview for unlinked visual assets", () => {
    render(<VisualImagePreview songId="1" asset={visual({ linkedFile: null })} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(getVisualMediaAccessMock).not.toHaveBeenCalled();
  });

  it("requests media access for linked image assets", async () => {
    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    await waitFor(() => {
      expect(getVisualMediaAccessMock).toHaveBeenCalledWith("1", "22");
    });
  });

  it("uses the signed Artist OS media URL as the image source", async () => {
    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    const image = await renderedImage();

    expect(image).toHaveAttribute("src", access().mediaUrl);
    expect(image.getAttribute("src")).not.toContain("accessToken");
    expect(image.getAttribute("src")).not.toContain("jwt");
  });

  it("shows a loading state while acquiring media access", async () => {
    getVisualMediaAccessMock.mockReturnValue(new Promise(() => undefined));

    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    expect(await screen.findByText("GETTING PREVIEW")).toBeInTheDocument();
  });

  it("shows the loaded preview after the browser image load event", async () => {
    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    const image = await renderedImage();
    fireEvent.load(image);

    expect(screen.queryByText("LOADING IMAGE")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open preview for cover-final.png/i })).toBeEnabled();
  });

  it("shows an image error state when the browser cannot decode the image", async () => {
    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    fireEvent.error(await renderedImage());

    expect(await screen.findByText("IMAGE UNAVAILABLE")).toBeInTheDocument();
    expect(screen.getByText("Could not load preview.")).toBeInTheDocument();
  });

  it("retry reacquires media access after a failed image load", async () => {
    getVisualMediaAccessMock
      .mockResolvedValueOnce(access())
      .mockResolvedValueOnce(access({ mediaUrl: "http://localhost:5178/fresh-image?token=fresh" }));
    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    fireEvent.error(await renderedImage());
    await userEvent.click(await screen.findByRole("button", { name: /retry preview/i }));

    await waitFor(() => {
      expect(getVisualMediaAccessMock).toHaveBeenCalledTimes(2);
    });
    expect(await renderedImage()).toHaveAttribute(
      "src",
      "http://localhost:5178/fresh-image?token=fresh",
    );
  });

  it("shows product copy when media access fails", async () => {
    getVisualMediaAccessMock.mockRejectedValue(new Error("network down"));

    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    expect(await screen.findByText("Could not load preview.")).toBeInTheDocument();
  });

  it("shows reconnect guidance when media access reports reauthorization required", async () => {
    getVisualMediaAccessMock.mockRejectedValue(
      new ApiError('{"title":"Google Drive authorization needs to be refreshed."}', 409),
    );

    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    expect(
      await screen.findByText("Reconnect Google Drive from Settings before previewing."),
    ).toBeInTheDocument();
  });

  it("shows connect guidance when media access reports disconnected Drive", async () => {
    getVisualMediaAccessMock.mockRejectedValue(
      new ApiError('{"title":"Google Drive is not connected."}', 409),
    );

    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    expect(
      await screen.findByText("Connect Google Drive from Settings before previewing."),
    ).toBeInTheDocument();
  });

  it("does not render an image preview for video assets", () => {
    render(
      <VisualImagePreview
        songId="1"
        asset={linkedVisual("official-video-v1.mp4", "video/mp4", { type: "MusicVideo" })}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(getVisualMediaAccessMock).not.toHaveBeenCalled();
  });

  it("supports PNG image previews", async () => {
    render(<VisualImagePreview songId="1" asset={linkedVisual("cover.png", "image/png")} />);

    expect(await renderedImage(/cover.png preview/i)).toBeInTheDocument();
  });

  it("supports JPEG image previews", async () => {
    render(<VisualImagePreview songId="1" asset={linkedVisual("cover.jpg", "image/jpeg")} />);

    expect(await renderedImage(/cover.jpg preview/i)).toBeInTheDocument();
  });

  it("supports WEBP image previews", async () => {
    render(<VisualImagePreview songId="1" asset={linkedVisual("cover.webp", "image/webp")} />);

    expect(await renderedImage(/cover.webp preview/i)).toBeInTheDocument();
  });

  it("uses a safe image extension when MIME type is missing", async () => {
    render(<VisualImagePreview songId="1" asset={linkedVisual("cover.jpeg", null)} />);

    expect(await renderedImage(/cover.jpeg preview/i)).toBeInTheDocument();
  });

  it("does not preview unsupported active-content image formats", () => {
    render(<VisualImagePreview songId="1" asset={linkedVisual("cover.svg", "image/svg+xml")} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(getVisualMediaAccessMock).not.toHaveBeenCalled();
  });

  it("opens a larger preview dialog", async () => {
    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    const image = await renderedImage();
    fireEvent.load(image);
    await userEvent.click(
      screen.getByRole("button", { name: /open preview for cover-final.png/i }),
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /cover-final.png large preview/i })).toHaveAttribute(
      "src",
      access().mediaUrl,
    );
  });

  it("closes the larger preview dialog", async () => {
    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    const image = await renderedImage();
    fireEvent.load(image);
    await userEvent.click(
      screen.getByRole("button", { name: /open preview for cover-final.png/i }),
    );
    await userEvent.click(await screen.findByRole("button", { name: /close preview/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("reacquires stale media access before opening the large preview", async () => {
    getVisualMediaAccessMock
      .mockResolvedValueOnce(access({ expiresAt: new Date(Date.now() + 1_000).toISOString() }))
      .mockResolvedValueOnce(access({ mediaUrl: "http://localhost:5178/fresh-large?token=fresh" }));
    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    const image = await renderedImage();
    fireEvent.load(image);
    await userEvent.click(
      screen.getByRole("button", { name: /open preview for cover-final.png/i }),
    );

    await waitFor(() => {
      expect(getVisualMediaAccessMock).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByRole("img", { name: /cover-final.png large preview/i })).toHaveAttribute(
      "src",
      "http://localhost:5178/fresh-large?token=fresh",
    );
  });

  it("invalidates stale preview access when the linked file changes", async () => {
    getVisualMediaAccessMock.mockResolvedValueOnce(access()).mockResolvedValueOnce(
      access({
        mediaUrl: "http://localhost:5178/api/songs/1/visual-assets/22/media?token=new-link",
        fileName: "new-cover.png",
      }),
    );
    const rendered = render(<VisualImagePreview songId="1" asset={baseVisual} />);

    expect(await renderedImage()).toHaveAttribute("src", access().mediaUrl);
    rendered.rerender(
      <VisualImagePreview
        songId="1"
        asset={visual({
          fileName: "new-cover.png",
          linkedFile: {
            ...baseVisual.linkedFile!,
            id: 99,
            displayName: "new-cover.png",
            mimeType: "image/png",
          },
        })}
      />,
    );

    await waitFor(() => {
      expect(getVisualMediaAccessMock).toHaveBeenCalledTimes(2);
    });
    expect(await renderedImage(/new-cover.png preview/i)).toHaveAttribute(
      "src",
      "http://localhost:5178/api/songs/1/visual-assets/22/media?token=new-link",
    );
  });

  it("does not persist signed media URLs in browser storage", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");

    render(<VisualImagePreview songId="1" asset={baseVisual} />);
    expect(await renderedImage()).toBeInTheDocument();

    expect(localStorageSpy).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.stringMatching(/token=/),
    );
    expect(sessionStorage.getItem("mediaUrl")).toBeNull();
    expect(localStorage.getItem("mediaUrl")).toBeNull();
  });

  it("does not render unsupported download, version, or edit-image controls", async () => {
    render(<VisualImagePreview songId="1" asset={baseVisual} />);

    expect(await renderedImage()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /download/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new version/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit image/i })).not.toBeInTheDocument();
  });
});
