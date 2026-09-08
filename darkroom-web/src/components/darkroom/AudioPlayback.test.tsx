import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api/client";
import { renderWithQueryClient } from "@/test/render";
import type { AudioAsset, MediaAccessResponse } from "@/types";

const {
  getAudioAssetsMock,
  getAudioMediaAccessMock,
  createAudioAssetMock,
  updateAudioAssetMock,
  deleteAudioAssetMock,
  uploadAudioAssetFileMock,
  getGoogleDriveStatusMock,
} = vi.hoisted(() => ({
  getAudioAssetsMock: vi.fn(),
  getAudioMediaAccessMock: vi.fn(),
  createAudioAssetMock: vi.fn(),
  updateAudioAssetMock: vi.fn(),
  deleteAudioAssetMock: vi.fn(),
  uploadAudioAssetFileMock: vi.fn(),
  getGoogleDriveStatusMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/services/api/audioAssets", () => ({
  audioAssetsApi: {
    getAudioAssets: getAudioAssetsMock,
    createAudioAsset: createAudioAssetMock,
    updateAudioAsset: updateAudioAssetMock,
    deleteAudioAsset: deleteAudioAssetMock,
    uploadAudioAssetFile: uploadAudioAssetFileMock,
    createAudioAssetVersion: vi.fn(),
    replaceAudioAssetFile: vi.fn(),
    getAudioMediaAccess: getAudioMediaAccessMock,
  },
}));

vi.mock("@/services/api/googleDrive", () => ({
  googleDriveConnectionQueryKey: ["google-drive", "connection"],
  googleDriveApi: {
    getStatus: getGoogleDriveStatusMock,
  },
}));

import { AudioWorkspace } from "./workbench/audio/AudioWorkspace";

const baseAudio: AudioAsset = {
  id: 11,
  songId: 1,
  assetFamilyId: "audio-family-1",
  type: "Demo",
  fileName: "demo.wav",
  version: 1,
  status: "Draft",
  durationSeconds: 100,
  fileSizeBytes: 123,
  uploadedAt: "2026-08-31T10:00:00Z",
  isCurrent: true,
  linkedFile: null,
};

const linkedAudio: AudioAsset = {
  ...baseAudio,
  fileName: "master.wav",
  linkedFile: {
    id: 91,
    provider: "GoogleDrive",
    resourceType: "AudioAssetFile",
    isFolder: false,
    displayName: "master.wav",
    mimeType: "audio/mpeg",
    sizeBytes: 1024,
    webViewLink: "https://drive.google.test/file/91",
    createdAt: "2026-08-31T10:00:00Z",
    updatedAt: "2026-08-31T10:00:00Z",
  },
};

const secondLinkedAudio: AudioAsset = {
  ...linkedAudio,
  id: 12,
  fileName: "mix.wav",
  type: "Mix",
  linkedFile: linkedAudio.linkedFile
    ? {
        ...linkedAudio.linkedFile,
        id: 92,
        displayName: "mix.wav",
        webViewLink: "https://drive.google.test/file/92",
      }
    : null,
};

function access(overrides: Partial<MediaAccessResponse> = {}): MediaAccessResponse {
  return {
    mediaUrl: "http://localhost:5178/api/songs/1/audio-assets/11/media?token=signed-media-token",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    mimeType: "audio/mpeg",
    fileName: "master.wav",
    sizeBytes: 1024,
    ...overrides,
  };
}

function renderAudioWorkspace(assets: AudioAsset[] = [linkedAudio]) {
  getAudioAssetsMock.mockResolvedValue(assets);
  return renderWithQueryClient(<AudioWorkspace songId="1" />);
}

function audioElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll("audio"));
}

async function findAudioElement(container: HTMLElement) {
  await waitFor(() => {
    expect(audioElements(container)[0]).toBeTruthy();
  });
  return audioElements(container)[0] as HTMLMediaElement;
}

describe("Audio playback", () => {
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

    getGoogleDriveStatusMock.mockResolvedValue({
      connected: true,
      status: "Connected",
    });
    createAudioAssetMock.mockResolvedValue(baseAudio);
    updateAudioAssetMock.mockResolvedValue(baseAudio);
    deleteAudioAssetMock.mockResolvedValue(undefined);
    uploadAudioAssetFileMock.mockResolvedValue(linkedAudio);
    getAudioMediaAccessMock.mockResolvedValue(access());
  });

  it("does not show active playback controls for unlinked assets", async () => {
    renderAudioWorkspace([baseAudio]);

    expect(await screen.findByText("ATTACH AUDIO FILE")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /play/i })).not.toBeInTheDocument();
  });

  it("shows Play for a linked asset", async () => {
    renderAudioWorkspace();

    expect(await screen.findByRole("button", { name: /play master.wav/i })).toBeInTheDocument();
  });

  it("requests media access on first Play and uses the signed Artist OS URL as audio source", async () => {
    const { container } = renderAudioWorkspace();

    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    await waitFor(() => {
      expect(getAudioMediaAccessMock).toHaveBeenCalledWith("1", "11");
    });
    expect(audioElements(container)[0].src).toBe(access().mediaUrl);
    expect(audioElements(container)[0].src).not.toContain("accessToken");
    expect(audioElements(container)[0].src).not.toContain("jwt");
  });

  it("moves from Play to Pause after playback starts", async () => {
    renderAudioWorkspace();

    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    expect(await screen.findByRole("button", { name: /pause master.wav/i })).toBeInTheDocument();
  });

  it("pauses and resumes without requesting fresh non-expired access", async () => {
    renderAudioWorkspace();

    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));
    await userEvent.click(await screen.findByRole("button", { name: /pause master.wav/i }));
    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    expect(pauseMock).toHaveBeenCalled();
    expect(playMock).toHaveBeenCalledTimes(2);
    expect(getAudioMediaAccessMock).toHaveBeenCalledTimes(1);
  });

  it("pauses the first player when a second linked asset starts", async () => {
    renderAudioWorkspace([linkedAudio, secondLinkedAudio]);

    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));
    await userEvent.click(await screen.findByRole("button", { name: /play mix.wav/i }));

    expect(pauseMock).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: /pause mix.wav/i })).toBeInTheDocument();
  });

  it("displays native loaded metadata duration when available", async () => {
    const { container } = renderAudioWorkspace();
    const audio = await findAudioElement(container);

    durationByElement.set(audio, 198);
    fireEvent.loadedMetadata(audio);

    expect(await screen.findByText("0:00 / 3:18")).toBeInTheDocument();
  });

  it("updates elapsed time from native timeupdate events", async () => {
    const { container } = renderAudioWorkspace();
    const audio = await findAudioElement(container);

    durationByElement.set(audio, 198);
    currentTimeByElement.set(audio, 42);
    fireEvent.loadedMetadata(audio);
    fireEvent.timeUpdate(audio);

    expect(await screen.findByText("0:42 / 3:18")).toBeInTheDocument();
  });

  it("seeks by changing native currentTime", async () => {
    const { container } = renderAudioWorkspace();
    const audio = await findAudioElement(container);

    durationByElement.set(audio, 198);
    fireEvent.loadedMetadata(audio);
    fireEvent.change(screen.getByRole("slider", { name: /seek master.wav/i }), {
      target: { value: "60" },
    });

    expect(audio.currentTime).toBe(60);
    expect(screen.getByText("1:00 / 3:18")).toBeInTheDocument();
  });

  it("shows buffering state from native waiting events", async () => {
    const { container } = renderAudioWorkspace();
    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    fireEvent.waiting(await findAudioElement(container));

    expect(await screen.findByText("Buffering")).toBeInTheDocument();
  });

  it("returns to paused state at the end of the track", async () => {
    const { container } = renderAudioWorkspace();
    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    fireEvent.ended(audioElements(container)[0]);

    expect(await screen.findByRole("button", { name: /play master.wav/i })).toBeInTheDocument();
  });

  it("shows a product error when media access fails", async () => {
    getAudioMediaAccessMock.mockRejectedValue(new Error("network down"));
    renderAudioWorkspace();

    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    expect(await screen.findByText("Could not load audio.")).toBeInTheDocument();
  });

  it("shows reconnect guidance when media access reports reauth required", async () => {
    getAudioMediaAccessMock.mockRejectedValue(
      new ApiError('{"title":"Google Drive authorization needs to be refreshed."}', 409),
    );
    renderAudioWorkspace();

    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    expect(
      await screen.findByText("Reconnect Google Drive from Settings before playback."),
    ).toBeInTheDocument();
  });

  it("shows connect guidance when media access reports disconnected Drive", async () => {
    getAudioMediaAccessMock.mockRejectedValue(
      new ApiError('{"title":"Google Drive is not connected."}', 409),
    );
    renderAudioWorkspace();

    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    expect(
      await screen.findByText("Connect Google Drive from Settings before playback."),
    ).toBeInTheDocument();
  });

  it("shows playback fallback on native audio error", async () => {
    const { container } = renderAudioWorkspace();
    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    fireEvent.error(audioElements(container)[0]);

    expect(await screen.findByText("Playback unavailable in this browser.")).toBeInTheDocument();
  });

  it("reacquires expired media access before playback", async () => {
    getAudioMediaAccessMock
      .mockResolvedValueOnce(access({ expiresAt: new Date(Date.now() + 1_000).toISOString() }))
      .mockResolvedValueOnce(access({ mediaUrl: "http://localhost:5178/new-url?token=fresh" }));
    renderAudioWorkspace();

    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));
    await userEvent.click(await screen.findByRole("button", { name: /pause master.wav/i }));
    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    expect(getAudioMediaAccessMock).toHaveBeenCalledTimes(2);
  });

  it("reuses valid non-expired media access", async () => {
    renderAudioWorkspace();

    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));
    await userEvent.click(await screen.findByRole("button", { name: /pause master.wav/i }));
    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    expect(getAudioMediaAccessMock).toHaveBeenCalledTimes(1);
  });

  it("does not render waveform, download, or sync controls", async () => {
    renderAudioWorkspace();

    expect(await screen.findByRole("button", { name: /play master.wav/i })).toBeInTheDocument();
    expect(screen.queryByText(/waveform/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /download/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sync/i })).not.toBeInTheDocument();
  });

  it("has accessible playback and seek controls", async () => {
    renderAudioWorkspace();

    expect(await screen.findByRole("button", { name: /play master.wav/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /seek master.wav/i })).toBeInTheDocument();
  });

  it("clears stale access when the linked file changes", async () => {
    getAudioAssetsMock.mockResolvedValueOnce([linkedAudio]).mockResolvedValueOnce([
      {
        ...linkedAudio,
        linkedFile: linkedAudio.linkedFile
          ? { ...linkedAudio.linkedFile, id: 99, displayName: "new-master.wav" }
          : null,
      },
    ]);
    const rendered = renderWithQueryClient(<AudioWorkspace songId="1" />);

    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));
    rendered.unmount();
    renderWithQueryClient(<AudioWorkspace songId="1" />);
    await userEvent.click(await screen.findByRole("button", { name: /play master.wav/i }));

    expect(getAudioMediaAccessMock).toHaveBeenCalledTimes(2);
  });
});
