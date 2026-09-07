import { Loader2, Pause, Play, RotateCcw, VideoOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { visualAssetsApi } from "@/services/api/visualAssets";
import { ApiError } from "@/services/api/client";
import type { MediaAccessResponse, VisualAsset } from "@/types";
import { cn } from "@/lib/utils";

const MEDIA_ACCESS_REFRESH_WINDOW_MS = 30_000;
const SUPPORTED_VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
const SUPPORTED_VIDEO_EXTENSIONS = ["mp4", "mov", "webm"] as const;

type PlaybackState =
  "idle" | "acquiring" | "loading" | "playing" | "paused" | "buffering" | "error";

function formatPlaybackTime(seconds: number | undefined) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return "--:--";
  }

  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function mediaAccessIsFresh(access: MediaAccessResponse | null) {
  if (!access) return false;

  const expiresAt = Date.parse(access.expiresAt);
  if (!Number.isFinite(expiresAt)) return false;

  return expiresAt - Date.now() > MEDIA_ACCESS_REFRESH_WINDOW_MS;
}

function mediaAccessErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    let detail = error.message;
    try {
      const parsed = JSON.parse(error.message) as { title?: unknown; error?: unknown };
      if (typeof parsed.title === "string") detail = parsed.title;
      if (typeof parsed.error === "string") detail = parsed.error;
    } catch {
      // Plain text API responses are also possible.
    }

    if (error.status === 409 && detail.includes("authorization needs to be refreshed")) {
      return "Reconnect Google Drive from Settings before previewing video.";
    }

    if (error.status === 409 && detail.includes("Google Drive is not connected")) {
      return "Connect Google Drive from Settings before previewing video.";
    }

    if (error.status === 409 && detail.includes("linked media file")) {
      return "Video unavailable.";
    }
  }

  return "Could not load video.";
}

function linkedFileName(asset: VisualAsset) {
  return asset.linkedFile?.displayName || asset.fileName;
}

function fileExtension(fileName: string) {
  return fileName.split(".").pop()?.trim().toLowerCase() ?? "";
}

function isPreviewableVisualVideo(asset: VisualAsset) {
  const linkedFile = asset.linkedFile;
  if (!linkedFile) return false;

  const mimeType = linkedFile.mimeType?.trim().toLowerCase();
  if (mimeType) {
    return SUPPORTED_VIDEO_MIME_TYPES.includes(
      mimeType as (typeof SUPPORTED_VIDEO_MIME_TYPES)[number],
    );
  }

  return SUPPORTED_VIDEO_EXTENSIONS.includes(
    fileExtension(
      linkedFile.displayName || asset.fileName,
    ) as (typeof SUPPORTED_VIDEO_EXTENSIONS)[number],
  );
}

export function VisualVideoPreview({
  songId,
  asset,
  isActive,
  onActivate,
  onDeactivate,
}: {
  songId: string;
  asset: VisualAsset;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const linkedFileId = String(asset.linkedFile?.id ?? "");
  const videoName = linkedFileName(asset);
  const previewable = isPreviewableVisualVideo(asset);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const retryingRef = useRef(false);
  const previousLinkedFileIdRef = useRef(linkedFileId);
  const [access, setAccess] = useState<MediaAccessResponse | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | undefined>();
  const [error, setError] = useState("");

  const isBusy = playbackState === "acquiring" || playbackState === "loading";
  const isPlaying = playbackState === "playing" || playbackState === "buffering";
  const canSeek = Number.isFinite(duration) && (duration ?? 0) > 0;

  const clearVideoSource = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.removeAttribute("src");
    video.load();
  }, []);

  useEffect(() => {
    if (!previewable) {
      return;
    }

    if (previousLinkedFileIdRef.current === linkedFileId) {
      return;
    }

    previousLinkedFileIdRef.current = linkedFileId;
    retryingRef.current = false;
    setAccess(null);
    setCurrentTime(0);
    setDuration(undefined);
    setError("");
    setPlaybackState("idle");
    clearVideoSource();
    onDeactivate();
  }, [clearVideoSource, linkedFileId, onDeactivate, previewable]);

  useEffect(() => {
    if (
      !isActive &&
      videoRef.current &&
      (playbackState === "playing" || playbackState === "buffering")
    ) {
      videoRef.current.pause();
      setPlaybackState("paused");
    }
  }, [isActive, playbackState]);

  const ensureFreshAccess = useCallback(async () => {
    if (mediaAccessIsFresh(access)) {
      return access;
    }

    setPlaybackState("acquiring");
    const nextAccess = await visualAssetsApi.getVisualMediaAccess(songId, String(asset.id));
    setAccess(nextAccess);
    return nextAccess;
  }, [access, asset.id, songId]);

  const startPlayback = useCallback(
    async (isRetry = false) => {
      const video = videoRef.current;
      if (!video) return;

      onActivate();
      setError("");

      try {
        const freshAccess = await ensureFreshAccess();
        if (video.src !== freshAccess.mediaUrl) {
          video.src = freshAccess.mediaUrl;
          video.load();
        }

        setPlaybackState("loading");
        await video.play();
        retryingRef.current = isRetry;
        setPlaybackState("playing");
      } catch (caught) {
        setPlaybackState("error");
        setError(mediaAccessErrorMessage(caught));
      }
    },
    [ensureFreshAccess, onActivate],
  );

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setPlaybackState("paused");
      onDeactivate();
      return;
    }

    retryingRef.current = false;
    await startPlayback(false);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;

    setDuration(Number.isFinite(video.duration) ? video.duration : undefined);
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
  }

  function handleWaiting() {
    if (isPlaying) {
      setPlaybackState("buffering");
    }
  }

  function handlePlaying() {
    setPlaybackState("playing");
  }

  function handlePause() {
    if (playbackState !== "error") {
      setPlaybackState("paused");
    }
  }

  function handleEnded() {
    setPlaybackState("paused");
    onDeactivate();
  }

  function handleError() {
    if (!retryingRef.current && !mediaAccessIsFresh(access)) {
      retryingRef.current = true;
      setAccess(null);
      void startPlayback(true);
      return;
    }

    setPlaybackState("error");
    setError("Playback not supported in this browser.");
  }

  function handleSeek(value: string) {
    const video = videoRef.current;
    const nextTime = Number(value);
    if (!video || !Number.isFinite(nextTime)) return;

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  async function retryPreview() {
    setAccess(null);
    retryingRef.current = false;
    await startPlayback(false);
  }

  if (!previewable) {
    return null;
  }

  const buttonLabel = isPlaying ? `Pause ${videoName}` : `Play ${videoName}`;
  const statusText =
    playbackState === "acquiring"
      ? "Getting secure media access"
      : playbackState === "loading"
        ? "Loading video"
        : playbackState === "buffering"
          ? "Buffering"
          : "";

  return (
    <div className="mb-3">
      <div className="relative aspect-video w-full overflow-hidden border border-border bg-black">
        <video
          ref={videoRef}
          preload="metadata"
          aria-label={`${videoName} video preview`}
          className="h-full w-full object-contain"
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={handleError}
        />
        {!access ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-white">
            <Play className="h-7 w-7" aria-hidden="true" />
            <p className="label-tech text-white">VIDEO PREVIEW</p>
          </div>
        ) : null}
        {isBusy ? (
          <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-background/85 p-2 text-xs text-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{statusText}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={togglePlayback}
          disabled={isBusy}
          aria-label={buttonLabel}
          aria-busy={isBusy}
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {formatPlaybackTime(currentTime)} / {formatPlaybackTime(duration)}
        </p>
        {statusText ? (
          <p className="text-xs uppercase tracking-normal text-muted-foreground" role="status">
            {statusText}
          </p>
        ) : null}
      </div>

      <label className="sr-only" htmlFor={`visual-video-seek-${asset.id}`}>
        Seek {videoName}
      </label>
      <input
        id={`visual-video-seek-${asset.id}`}
        aria-label={`Seek ${videoName}`}
        className={cn(
          "mt-3 h-2 w-full cursor-pointer accent-foreground",
          !canSeek && "cursor-not-allowed opacity-50",
        )}
        type="range"
        min={0}
        max={canSeek ? duration : 0}
        step="0.1"
        value={canSeek ? Math.min(currentTime, duration ?? 0) : 0}
        disabled={!canSeek}
        onChange={(event) => handleSeek(event.target.value)}
      />

      {error ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-destructive">
          <VideoOff className="h-4 w-4" aria-hidden="true" />
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={retryPreview}>
            <RotateCcw className="h-4 w-4" />
            Retry video
          </Button>
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {playbackState}
      </p>
    </div>
  );
}
