import { Loader2, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { audioAssetsApi } from "@/services/api/audioAssets";
import { ApiError } from "@/services/api/client";
import type { AudioAsset, MediaAccessResponse } from "@/types";
import { cn } from "@/lib/utils";

const MEDIA_ACCESS_REFRESH_WINDOW_MS = 30_000;

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
      return "Reconnect Google Drive from Settings before playback.";
    }

    if (error.status === 409 && detail.includes("Google Drive is not connected")) {
      return "Connect Google Drive from Settings before playback.";
    }

    if (error.status === 409 && detail.includes("linked media file")) {
      return "File unavailable.";
    }
  }

  return "Could not load audio.";
}

export function AudioPlayer({
  songId,
  asset,
  isActive,
  onActivate,
  onDeactivate,
}: {
  songId: string;
  asset: AudioAsset;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const linkedFileId = String(asset.linkedFile?.id ?? "");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryingRef = useRef(false);
  const previousLinkedFileIdRef = useRef(linkedFileId);
  const [access, setAccess] = useState<MediaAccessResponse | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | undefined>(asset.durationSeconds ?? undefined);
  const [error, setError] = useState("");

  const isBusy = playbackState === "acquiring" || playbackState === "loading";
  const isPlaying = playbackState === "playing" || playbackState === "buffering";
  const canSeek = Number.isFinite(duration) && (duration ?? 0) > 0;

  useEffect(() => {
    if (previousLinkedFileIdRef.current === linkedFileId) {
      return;
    }

    previousLinkedFileIdRef.current = linkedFileId;
    setAccess(null);
    setCurrentTime(0);
    retryingRef.current = false;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setPlaybackState("idle");
  }, [linkedFileId]);

  useEffect(() => {
    if (
      !isActive &&
      audioRef.current &&
      (playbackState === "playing" || playbackState === "buffering")
    ) {
      audioRef.current.pause();
      setPlaybackState("paused");
    }
  }, [isActive, playbackState]);

  const ensureFreshAccess = useCallback(async () => {
    if (mediaAccessIsFresh(access)) {
      return access;
    }

    setPlaybackState("acquiring");
    const nextAccess = await audioAssetsApi.getAudioMediaAccess(songId, String(asset.id));
    setAccess(nextAccess);
    return nextAccess;
  }, [access, asset.id, songId]);

  const startPlayback = useCallback(
    async (isRetry = false) => {
      const audio = audioRef.current;
      if (!audio) return;

      onActivate();
      setError("");

      try {
        const freshAccess = await ensureFreshAccess();
        if (audio.src !== freshAccess.mediaUrl) {
          audio.src = freshAccess.mediaUrl;
          audio.load();
        }

        setPlaybackState("loading");
        await audio.play();
        retryingRef.current = isRetry;
        setPlaybackState("playing");
      } catch (caught) {
        setPlaybackState("error");
        setError(mediaAccessErrorMessage(caught));
      }
    },
    [ensureFreshAccess, onActivate],
  );

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setPlaybackState("paused");
      onDeactivate();
      return;
    }

    await startPlayback(false);
  };

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;

    setDuration(Number.isFinite(audio.duration) ? audio.duration : undefined);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
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
    setError("Playback unavailable in this browser.");
  }

  function handleSeek(value: string) {
    const audio = audioRef.current;
    const nextTime = Number(value);
    if (!audio || !Number.isFinite(nextTime)) return;

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  const buttonLabel = isPlaying ? `Pause ${asset.fileName}` : `Play ${asset.fileName}`;
  const statusText =
    playbackState === "acquiring"
      ? "Getting secure media access"
      : playbackState === "loading"
        ? "Loading audio"
        : playbackState === "buffering"
          ? "Buffering"
          : "";

  return (
    <div className="mt-3 border-t border-border pt-3">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
      />
      <div className="flex flex-wrap items-center gap-3">
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
      <label className="sr-only" htmlFor={`audio-seek-${asset.id}`}>
        Seek {asset.fileName}
      </label>
      <input
        id={`audio-seek-${asset.id}`}
        aria-label={`Seek ${asset.fileName}`}
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
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      <p className="sr-only" aria-live="polite">
        {playbackState}
      </p>
    </div>
  );
}
