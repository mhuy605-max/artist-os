import { Expand, ImageOff, Loader2, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { visualAssetsApi } from "@/services/api/visualAssets";
import { ApiError } from "@/services/api/client";
import type { MediaAccessResponse, VisualAsset } from "@/types";
import { cn } from "@/lib/utils";

const MEDIA_ACCESS_REFRESH_WINDOW_MS = 30_000;
const SUPPORTED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const SUPPORTED_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;

type ImagePreviewState = "idle" | "acquiring" | "loading" | "loaded" | "error";

function mediaAccessIsFresh(access: MediaAccessResponse | null) {
  if (!access) return false;

  const expiresAt = Date.parse(access.expiresAt);
  if (!Number.isFinite(expiresAt)) return false;

  return expiresAt - Date.now() > MEDIA_ACCESS_REFRESH_WINDOW_MS;
}

function imagePreviewErrorMessage(error: unknown) {
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
      return "Reconnect Google Drive from Settings before previewing.";
    }

    if (error.status === 409 && detail.includes("Google Drive is not connected")) {
      return "Connect Google Drive from Settings before previewing.";
    }

    if (error.status === 409 && detail.includes("linked media file")) {
      return "Image unavailable.";
    }
  }

  return "Could not load preview.";
}

function linkedFileName(asset: VisualAsset) {
  return asset.linkedFile?.displayName || asset.fileName;
}

function fileExtension(fileName: string) {
  return fileName.split(".").pop()?.trim().toLowerCase() ?? "";
}

function isPreviewableVisualImage(asset: VisualAsset) {
  const linkedFile = asset.linkedFile;
  if (!linkedFile) return false;

  const mimeType = linkedFile.mimeType?.trim().toLowerCase();
  if (mimeType) {
    return SUPPORTED_IMAGE_MIME_TYPES.includes(
      mimeType as (typeof SUPPORTED_IMAGE_MIME_TYPES)[number],
    );
  }

  return SUPPORTED_IMAGE_EXTENSIONS.includes(
    fileExtension(
      linkedFile.displayName || asset.fileName,
    ) as (typeof SUPPORTED_IMAGE_EXTENSIONS)[number],
  );
}

export function VisualImagePreview({ songId, asset }: { songId: string; asset: VisualAsset }) {
  const linkedFileId = String(asset.linkedFile?.id ?? "");
  const imageName = linkedFileName(asset);
  const previewable = isPreviewableVisualImage(asset);
  const [access, setAccess] = useState<MediaAccessResponse | null>(null);
  const [previewState, setPreviewState] = useState<ImagePreviewState>("idle");
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const previousLinkedFileIdRef = useRef(linkedFileId);

  const requestFreshAccess = useCallback(async () => {
    setPreviewState("acquiring");
    setError("");

    const nextAccess = await visualAssetsApi.getVisualMediaAccess(songId, String(asset.id));
    setAccess(nextAccess);
    setPreviewState("loading");
    return nextAccess;
  }, [asset.id, songId]);

  useEffect(() => {
    if (!previewable) {
      return;
    }

    if (previousLinkedFileIdRef.current === linkedFileId) {
      return;
    }

    previousLinkedFileIdRef.current = linkedFileId;
    setAccess(null);
    setPreviewState("idle");
    setError("");
    setDialogOpen(false);
  }, [linkedFileId, previewable]);

  useEffect(() => {
    if (!previewable) {
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      try {
        setPreviewState("acquiring");
        const nextAccess = await visualAssetsApi.getVisualMediaAccess(songId, String(asset.id));
        if (cancelled) return;
        setAccess(nextAccess);
        setPreviewState("loading");
      } catch (caught) {
        if (cancelled) return;
        setPreviewState("error");
        setError(imagePreviewErrorMessage(caught));
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [asset.id, linkedFileId, previewable, songId]);

  async function retryPreview() {
    setAccess(null);
    try {
      await requestFreshAccess();
    } catch (caught) {
      setPreviewState("error");
      setError(imagePreviewErrorMessage(caught));
    }
  }

  async function openLargePreview() {
    setDialogOpen(true);
    if (mediaAccessIsFresh(access)) return;

    try {
      await requestFreshAccess();
    } catch (caught) {
      setPreviewState("error");
      setError(imagePreviewErrorMessage(caught));
    }
  }

  function handleImageLoad() {
    setPreviewState("loaded");
    setError("");
  }

  function handleImageError() {
    setPreviewState("error");
    setError("Could not load preview.");
  }

  if (!previewable) {
    return null;
  }

  const isLoaded = previewState === "loaded";
  const isBusy = previewState === "acquiring" || previewState === "loading";

  return (
    <div className="mb-3">
      <button
        type="button"
        className={cn(
          "group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border border-border bg-muted text-left",
          isLoaded && "cursor-zoom-in",
        )}
        onClick={openLargePreview}
        disabled={!access || previewState === "error"}
        aria-label={`Open preview for ${imageName}`}
      >
        {access ? (
          <img
            src={access.mediaUrl}
            alt={`${imageName} preview`}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-200",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : null}

        {!isLoaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted p-3 text-center">
            {previewState === "error" ? (
              <ImageOff className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
            <p className="label-tech">
              {previewState === "error"
                ? "IMAGE UNAVAILABLE"
                : previewState === "acquiring"
                  ? "GETTING PREVIEW"
                  : "LOADING IMAGE"}
            </p>
            {error ? <p className="max-w-48 text-xs text-muted-foreground">{error}</p> : null}
          </div>
        ) : (
          <span className="absolute right-2 top-2 border border-border bg-background/85 p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Expand className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </button>

      {previewState === "error" ? (
        <Button variant="outline" size="sm" className="mt-2" onClick={retryPreview}>
          <RotateCcw className="h-4 w-4" />
          Retry preview
        </Button>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl border-border bg-background">
          <DialogHeader>
            <DialogTitle className="break-words uppercase">{imageName}</DialogTitle>
            <DialogDescription>Visual asset preview</DialogDescription>
          </DialogHeader>
          <div className="relative flex max-h-[72vh] min-h-64 items-center justify-center overflow-hidden border border-border bg-muted">
            {access && previewState !== "error" ? (
              <img
                src={access.mediaUrl}
                alt={`${imageName} large preview`}
                className="max-h-[72vh] w-full object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                {isBusy ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <ImageOff className="h-5 w-5 text-muted-foreground" />
                )}
                <p className="label-tech">{isBusy ? "LOADING IMAGE" : "IMAGE UNAVAILABLE"}</p>
                {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4" />
              Close preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
