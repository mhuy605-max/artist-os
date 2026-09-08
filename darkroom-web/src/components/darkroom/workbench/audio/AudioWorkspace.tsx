import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderTree,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/darkroom/AppShell";
import { Logo } from "@/components/darkroom/Logo";
import { StatusBadge } from "@/components/darkroom/StatusBadge";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricBlock,
  PageHeader,
  Panel,
  formatDate,
  formatNumber,
} from "@/components/darkroom/Primitives";
import { analyticsApi } from "@/services/api/analytics";
import { authApi, authQueryKey } from "@/services/api/auth";
import { audioAssetsApi } from "@/services/api/audioAssets";
import { calendarApi } from "@/services/api/calendar";
import { contentItemsApi } from "@/services/api/contentItems";
import { creditsApi } from "@/services/api/credits";
import { dashboardApi } from "@/services/api/dashboard";
import {
  driveWorkspaceApi,
  driveWorkspaceQueryKey,
  isDriveWorkspaceDisconnectedError,
} from "@/services/api/driveWorkspace";
import {
  googleDriveApi,
  googleDriveConnectionQueryKey,
  openGoogleAuthorizationUrl,
  type GoogleDriveConnectionStatus,
} from "@/services/api/googleDrive";
import { ApiError } from "@/services/api/client";
import { releaseChecklistApi } from "@/services/api/releaseChecklist";
import { releasesApi } from "@/services/api/releases";
import { songsApi, isUsingFallbackData } from "@/services/api/songs";
import { visualAssetsApi } from "@/services/api/visualAssets";
import {
  ANALYTICS_PLATFORM_LABELS,
  ANALYTICS_PLATFORMS,
  AUDIO_ASSET_STATUSES,
  AUDIO_ASSET_TYPES,
  CALENDAR_EVENT_TYPE_LABELS,
  CONTENT_PLATFORMS,
  CONTENT_PLATFORM_LABELS,
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  CREDIT_ROLES,
  CREDIT_ROLE_LABELS,
  CREDIT_STATUSES,
  RELEASE_PLATFORM_LABELS,
  RELEASE_PLATFORMS,
  RELEASE_STATUSES,
  RELEASE_STATUS_LABELS,
  RELEASE_TYPES,
  RELEASE_TYPE_LABELS,
  SONG_STATUS_LABELS,
  SONG_STATUSES,
  VISUAL_ASSET_STATUSES,
  VISUAL_ASSET_STATUS_LABELS,
  VISUAL_ASSET_TYPES,
  VISUAL_ASSET_TYPE_LABELS,
  type AnalyticsPlatform,
  type AnalyticsSnapshot,
  type AnalyticsSnapshotPayload,
  type AudioAsset,
  type AudioAssetPayload,
  type AudioAssetStatus,
  type AudioAssetType,
  type CalendarEntry,
  type CalendarEventType,
  type ContentItem,
  type ContentItemPayload,
  type ContentPlatform,
  type ContentStatus,
  type ContentType,
  type Credit,
  type CreditPayload,
  type CreditRole,
  type CreditStatus,
  type DriveWorkspace,
  type ExternalFileReference,
  type DashboardActivityItem,
  type DashboardAnalyticsItem,
  type DashboardPipelineItem,
  type DashboardReleaseReadiness,
  type DashboardUpcomingItem,
  type Release,
  type ReleaseChecklistItem,
  type ReleaseChecklistItemPayload,
  type ReleasePayload,
  type ReleasePlatform,
  type ReleaseStatus,
  type ReleaseType,
  type Song,
  type SongPayload,
  type SongStatus,
  type VisualAsset,
  type VisualAssetPayload,
  type VisualAssetStatus,
  type VisualAssetType,
} from "@/types";
import { cn } from "@/lib/utils";

import { audioAssetsQueryKey, normalizeId, releaseReadinessQueryKey } from "../shared";
import { AudioPlayer } from "./AudioPlayer";

function useAudioAssetMutations(songId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: audioAssetsQueryKey(songId) });
    queryClient.invalidateQueries({ queryKey: releaseReadinessQueryKey(songId) });
  };

  return {
    create: useMutation({
      mutationFn: (payload: AudioAssetPayload) => audioAssetsApi.createAudioAsset(songId, payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        audioAssetId,
        payload,
      }: {
        audioAssetId: string;
        payload: AudioAssetPayload;
      }) => audioAssetsApi.updateAudioAsset(songId, audioAssetId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (audioAssetId: string) => audioAssetsApi.deleteAudioAsset(songId, audioAssetId),
      onSuccess: invalidate,
    }),
    upload: useMutation({
      mutationFn: ({ audioAssetId, file }: { audioAssetId: string; file: File }) =>
        audioAssetsApi.uploadAudioAssetFile(songId, audioAssetId, file),
      onSuccess: invalidate,
    }),
    createVersion: useMutation({
      mutationFn: (audioAssetId: string) =>
        audioAssetsApi.createAudioAssetVersion(songId, audioAssetId),
      onSuccess: invalidate,
    }),
    replaceFile: useMutation({
      mutationFn: ({ audioAssetId, file }: { audioAssetId: string; file: File }) =>
        audioAssetsApi.replaceAudioAssetFile(songId, audioAssetId, file),
      onSuccess: invalidate,
    }),
  };
}

function isAudioAssetType(value: string): value is AudioAssetType {
  return AUDIO_ASSET_TYPES.includes(value as AudioAssetType);
}

function isAudioAssetStatus(value: string): value is AudioAssetStatus {
  return AUDIO_ASSET_STATUSES.includes(value as AudioAssetStatus);
}

function validateAudioAssetPayload(payload: AudioAssetPayload) {
  const fileName = payload.fileName.trim();
  if (!fileName) return "File name is required.";
  if (fileName.length > 255) return "File name must be 255 characters or fewer.";
  if (!isAudioAssetType(payload.type)) return "Choose a valid type.";
  if (!Number.isInteger(payload.version) || payload.version < 1) {
    return "Version must be a positive whole number.";
  }
  if (!isAudioAssetStatus(payload.status)) return "Choose a valid status.";
  if (payload.durationSeconds != null && payload.durationSeconds < 0) {
    return "Duration must be zero or greater.";
  }
  if (payload.fileSizeBytes != null && payload.fileSizeBytes < 0) {
    return "File size must be zero or greater.";
  }
  return "";
}

function audioStatusLabel(status: AudioAssetStatus) {
  return status;
}

function externalProviderLabel(provider: string) {
  return provider === "GoogleDrive" ? "Google Drive" : provider;
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) return "No duration";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatFileSize(bytes?: number | null) {
  if (bytes == null) return "No file size";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function parseApiProblemTitle(error: ApiError) {
  try {
    const parsed = JSON.parse(error.message) as { title?: unknown; error?: unknown };
    if (typeof parsed.title === "string") return parsed.title;
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    // The API can also return a plain text error body.
  }

  return error.message;
}

function audioUploadErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "";

  if (error instanceof ApiError) {
    const detail = parseApiProblemTitle(error);

    if (error.status === 409 && detail.includes("Google Drive is not connected")) {
      return "Connect storage from Settings before attaching audio files.";
    }

    if (error.status === 409 && detail.includes("authorization needs to be refreshed")) {
      return "Reconnect Google Drive from Settings before attaching audio files.";
    }

    if (error.status === 409 && detail.toLowerCase().includes("already")) {
      return "File already linked. Use Replace File to swap the Drive file for this version.";
    }

    if (error.status === 409 && detail.toLowerCase().includes("does not have a linked")) {
      return "This version has no linked file yet. Use Upload file first.";
    }

    if (error.status === 400) {
      return detail;
    }

    if (error.status === 502) {
      return "Storage is temporarily unavailable. Try again when Google Drive is reachable.";
    }
  }

  return error.message || "The audio file could not be uploaded.";
}

interface AudioAssetFamilyGroup {
  assetFamilyId: string;
  assets: AudioAsset[];
}

function sortAudioVersions(assets: AudioAsset[]) {
  return [...assets].sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return b.version - a.version;
  });
}

function groupedAudioAssets(assets: AudioAsset[]) {
  return AUDIO_ASSET_TYPES.map((type) => ({
    type,
    families: Array.from(
      assets
        .filter((asset) => asset.type === type)
        .reduce((families, asset) => {
          const existing = families.get(asset.assetFamilyId) ?? [];
          existing.push(asset);
          families.set(asset.assetFamilyId, existing);
          return families;
        }, new Map<string, AudioAsset[]>()),
      ([assetFamilyId, familyAssets]): AudioAssetFamilyGroup => ({
        assetFamilyId,
        assets: sortAudioVersions(familyAssets),
      }),
    ).sort((a, b) => {
      const currentA = a.assets.find((asset) => asset.isCurrent) ?? a.assets[0];
      const currentB = b.assets.find((asset) => asset.isCurrent) ?? b.assets[0];
      return (currentB?.version ?? 0) - (currentA?.version ?? 0);
    }),
  })).filter((group) => group.families.length > 0);
}

function AudioSummary({ assets }: { assets: AudioAsset[] }) {
  const linkedCount = assets.filter((asset) => asset.linkedFile).length;
  const finalCount = assets.filter((asset) => asset.status === "Final").length;

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <MetricBlock label="TOTAL" value={assets.length} />
      <MetricBlock label="LINKED" value={linkedCount} />
      <MetricBlock label="FINAL" value={finalCount} />
    </div>
  );
}

function numberOrNull(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function AudioAssetFormDialog({
  songId,
  asset,
  defaultType = "Demo",
  trigger,
}: {
  songId: string;
  asset?: AudioAsset;
  defaultType?: AudioAssetType;
  trigger: ReactNode;
}) {
  const mode = asset ? "edit" : "create";
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState(asset?.fileName ?? "");
  const [type, setType] = useState<AudioAssetType>(asset?.type ?? defaultType);
  const [status, setStatus] = useState<AudioAssetStatus>(asset?.status ?? "Draft");
  const [durationSeconds, setDurationSeconds] = useState(
    asset?.durationSeconds == null ? "" : String(asset.durationSeconds),
  );
  const [fileSizeMb, setFileSizeMb] = useState(
    asset?.fileSizeBytes == null ? "" : (asset.fileSizeBytes / 1024 / 1024).toFixed(1),
  );
  const [error, setError] = useState("");
  const mutations = useAudioAssetMutations(songId);
  const mutation = mode === "create" ? mutations.create : mutations.update;

  async function submit() {
    const fileSizeMbValue = numberOrNull(fileSizeMb);
    const payload: AudioAssetPayload = {
      type,
      fileName: fileName.trim(),
      version: asset?.version ?? 1,
      status,
      durationSeconds: numberOrNull(durationSeconds),
      fileSizeBytes: fileSizeMbValue == null ? null : Math.round(fileSizeMbValue * 1024 * 1024),
      isCurrent: asset?.isCurrent ?? true,
    };
    const validationError = validateAudioAssetPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (mode === "create") {
        await mutations.create.mutateAsync(payload);
        setFileName("");
        setType(defaultType);
        setStatus("Draft");
        setDurationSeconds("");
        setFileSizeMb("");
      } else if (asset) {
        await mutations.update.mutateAsync({
          audioAssetId: String(asset.id),
          payload,
        });
      }
      setError("");
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The audio asset could not be saved.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === "create" ? "Add audio asset" : "Edit audio asset"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a workflow slot for a demo, recording, mix, or master. Attach the audio file after saving."
              : asset?.linkedFile
                ? "Update how this version is organized in DARKROOM SYSTEM. This does not rename the linked Drive file."
                : "Update this audio version before a file is attached."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label-tech" htmlFor={`${mode}-audio-file-name-${asset?.id ?? "new"}`}>
              Asset file name
            </label>
            <Input
              id={`${mode}-audio-file-name-${asset?.id ?? "new"}`}
              value={fileName}
              maxLength={255}
              onChange={(event) => setFileName(event.target.value)}
              className="mt-2"
              placeholder="mix_v7.wav"
            />
          </div>
          <div>
            <label className="label-tech">Type</label>
            <Select value={type} onValueChange={(value) => setType(value as AudioAssetType)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIO_ASSET_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as AudioAssetStatus)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIO_ASSET_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-audio-duration-${asset?.id ?? "new"}`}>
              Duration
            </label>
            <Input
              id={`${mode}-audio-duration-${asset?.id ?? "new"}`}
              type="number"
              min={0}
              step={1}
              value={durationSeconds}
              onChange={(event) => setDurationSeconds(event.target.value)}
              className="mt-2"
              placeholder="198"
            />
            <p className="mt-1 text-xs text-muted-foreground">Seconds, when known.</p>
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-audio-size-${asset?.id ?? "new"}`}>
              File size
            </label>
            <Input
              id={`${mode}-audio-size-${asset?.id ?? "new"}`}
              type="number"
              min={0}
              step="0.1"
              value={fileSizeMb}
              onChange={(event) => setFileSizeMb(event.target.value)}
              className="mt-2"
              placeholder="61.7"
            />
            <p className="mt-1 text-xs text-muted-foreground">MB, when known.</p>
          </div>
          {asset ? (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              V{asset.version} {asset.isCurrent ? "is current. " : ""}
              Versions are created with Create New Version.
            </p>
          ) : null}
          {error ? <p className="text-sm text-muted-foreground sm:col-span-2">{error}</p> : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateAudioVersionDialog({
  asset,
  createVersion,
  trigger,
}: {
  asset: AudioAsset;
  createVersion: {
    isPending: boolean;
    error: unknown;
    mutate: (audioAssetId: string) => void;
  };
  trigger: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create new version?</AlertDialogTitle>
          <AlertDialogDescription>
            Preserve v{asset.version} and start a new creative revision. The new version becomes
            current, starts as Draft, and will need its own uploaded file.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {createVersion.error ? (
          <p className="text-sm text-destructive">
            {createVersion.error instanceof Error
              ? createVersion.error.message
              : "The new version could not be created."}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={createVersion.isPending}
            onClick={() => createVersion.mutate(String(asset.id))}
          >
            {createVersion.isPending ? "Creating" : "Create version"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ReplaceAudioFileDialog({
  asset,
  replaceFile,
  trigger,
}: {
  asset: AudioAsset;
  replaceFile: {
    isPending: boolean;
    error: unknown;
    mutate: (input: { audioAssetId: string; file: File }) => void;
  };
  trigger: ReactNode;
}) {
  const fileInputId = useId();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function replace() {
    if (!selectedFile) return;
    replaceFile.mutate({ audioAssetId: String(asset.id), file: selectedFile });
    setOpen(false);
    setSelectedFile(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase">Replace file</DialogTitle>
          <DialogDescription>
            Keep v{asset.version}, but replace its uploaded file. Approved or Final versions may
            return to Review, and the old Drive file is not deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="label-tech" htmlFor={fileInputId}>
              Replacement audio file
            </label>
            <Input
              id={fileInputId}
              className="mt-2 text-xs"
              type="file"
              accept=".wav,.mp3,.flac,.m4a,audio/wav,audio/x-wav,audio/mpeg,audio/flac,audio/mp4"
              disabled={replaceFile.isPending}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <p className="mt-2 break-words text-xs text-muted-foreground">
                Selected: {selectedFile.name} / {formatFileSize(selectedFile.size)}
              </p>
            ) : null}
          </div>
          {replaceFile.error ? (
            <p className="text-sm text-destructive">{audioUploadErrorMessage(replaceFile.error)}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={replace} disabled={!selectedFile || replaceFile.isPending}>
              {replaceFile.isPending ? "Replacing" : "Replace file"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AudioFileAssociationPanel({
  songId,
  asset,
  driveStatus,
  driveStatusError,
  upload,
  replaceFile,
  isActive,
  onActivate,
  onDeactivate,
}: {
  songId: string;
  asset: AudioAsset;
  driveStatus?: GoogleDriveConnectionStatus;
  driveStatusError: boolean;
  upload: {
    isPending: boolean;
    error: unknown;
    mutate: (input: { audioAssetId: string; file: File }) => void;
  };
  replaceFile: {
    isPending: boolean;
    error: unknown;
    mutate: (input: { audioAssetId: string; file: File }) => void;
  };
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const fileInputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const linkedFile = asset.linkedFile;

  if (linkedFile) {
    return (
      <div className="border border-border bg-panel p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="label-tech">FILE LINKED</p>
            <p className="mt-1 break-words text-sm font-medium">{linkedFile.displayName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatFileSize(linkedFile.sizeBytes)} / {externalProviderLabel(linkedFile.provider)}
            </p>
          </div>
          {linkedFile.webViewLink ? (
            <Button variant="outline" size="sm" asChild>
              <a
                href={linkedFile.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${linkedFile.displayName} in Drive`}
              >
                <ExternalLink className="h-4 w-4" />
                Open in Drive
              </a>
            </Button>
          ) : null}
          <ReplaceAudioFileDialog
            asset={asset}
            replaceFile={replaceFile}
            trigger={
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
                Replace File
              </Button>
            }
          />
        </div>
        <AudioPlayer
          songId={songId}
          asset={asset}
          isActive={isActive}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      </div>
    );
  }

  if (driveStatus?.connected === false) {
    return (
      <div className="border border-dashed border-border bg-panel p-3">
        <p className="label-tech">CONNECT STORAGE TO UPLOAD</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Google Drive must be connected before attaching audio files.
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link to="/settings">Open Settings</Link>
        </Button>
      </div>
    );
  }

  if (driveStatus?.status === "ReauthRequired") {
    return (
      <div className="border border-dashed border-border bg-panel p-3">
        <p className="label-tech">STORAGE CONNECTION NEEDS ATTENTION</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reconnect Google Drive from Settings before attaching audio files.
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link to="/settings">Open Settings</Link>
        </Button>
      </div>
    );
  }

  if (!driveStatus && !driveStatusError) {
    return (
      <div className="border border-dashed border-border bg-panel p-3">
        <p className="label-tech">CHECKING STORAGE</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Checking Google Drive before file attachment is available.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-dashed border-border bg-panel p-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <label className="label-tech" htmlFor={fileInputId}>
            ATTACH AUDIO FILE
          </label>
          <p className="mt-1 text-xs text-muted-foreground">WAV, MP3, FLAC or M4A / up to 500 MB</p>
          {driveStatusError ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Storage status could not be checked. You can still manage metadata.
            </p>
          ) : null}
          {selectedFile ? (
            <p className="mt-2 break-words text-xs text-muted-foreground">
              Selected: {selectedFile.name} / {formatFileSize(selectedFile.size)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id={fileInputId}
            className="max-w-56 text-xs"
            type="file"
            accept=".wav,.mp3,.flac,.m4a,audio/wav,audio/x-wav,audio/mpeg,audio/flac,audio/mp4"
            disabled={upload.isPending}
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedFile || upload.isPending}
            onClick={() => {
              if (selectedFile) {
                upload.mutate({
                  audioAssetId: String(asset.id),
                  file: selectedFile,
                });
              }
            }}
          >
            <Upload className="h-4 w-4" />
            {upload.isPending ? "Uploading" : "Upload file"}
          </Button>
        </div>
      </div>
      {upload.error ? (
        <p className="mt-2 text-xs text-destructive">{audioUploadErrorMessage(upload.error)}</p>
      ) : null}
    </div>
  );
}

function AudioAssetRow({
  songId,
  asset,
  driveStatus,
  driveStatusError,
  activeAudioAssetId,
  onActivateAudio,
  onDeactivateAudio,
}: {
  songId: string;
  asset: AudioAsset;
  driveStatus?: GoogleDriveConnectionStatus;
  driveStatusError: boolean;
  activeAudioAssetId: string | null;
  onActivateAudio: (audioAssetId: string) => void;
  onDeactivateAudio: (audioAssetId: string) => void;
}) {
  const mutations = useAudioAssetMutations(songId);
  const removeCopy = asset.isCurrent
    ? "Deleting the current version will make the previous highest version current. The Google Drive file is not deleted."
    : asset.linkedFile
      ? "This removes the asset from DARKROOM SYSTEM. The linked Google Drive file will remain."
      : "This removes the asset from DARKROOM SYSTEM.";

  return (
    <article className="border border-border bg-background p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="label-tech">
              {asset.type} / V{asset.version}
            </p>
            {asset.isCurrent ? (
              <span className="border border-border px-2 py-1 text-xs uppercase">Current</span>
            ) : null}
            <StatusBadge status={audioStatusLabel(asset.status)} />
          </div>
          <p className="mt-3 break-words text-base font-semibold">
            {asset.fileName || "No file attached yet"}
          </p>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <p>
              <span className="label-tech block">DURATION</span>
              {formatDuration(asset.durationSeconds)}
            </p>
            <p>
              <span className="label-tech block">SIZE</span>
              {formatFileSize(asset.fileSizeBytes)}
            </p>
            <p>
              <span className="label-tech block">ADDED</span>
              {formatDate(asset.uploadedAt)}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <AudioAssetFormDialog
              songId={songId}
              asset={asset}
              trigger={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />
            <CreateAudioVersionDialog
              asset={asset}
              createVersion={mutations.createVersion}
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                  Create New Version
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove audio asset?</AlertDialogTitle>
                  <AlertDialogDescription>{removeCopy}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => mutations.remove.mutate(String(asset.id))}>
                    Remove asset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <AudioFileAssociationPanel
          songId={songId}
          asset={asset}
          driveStatus={driveStatus}
          driveStatusError={driveStatusError}
          upload={mutations.upload}
          isActive={activeAudioAssetId === String(asset.id)}
          onActivate={() => onActivateAudio(String(asset.id))}
          onDeactivate={() => onDeactivateAudio(String(asset.id))}
          replaceFile={mutations.replaceFile}
        />
      </div>
    </article>
  );
}

export function AudioWorkspace({ songId }: { songId: string }) {
  const [activeAudioAssetId, setActiveAudioAssetId] = useState<string | null>(null);
  const audioAssets = useQuery({
    queryKey: audioAssetsQueryKey(songId),
    queryFn: () => audioAssetsApi.getAudioAssets(songId),
  });
  const driveConnection = useQuery({
    queryKey: googleDriveConnectionQueryKey,
    queryFn: googleDriveApi.getStatus,
  });

  if (audioAssets.isLoading) {
    return (
      <div className="space-y-4">
        <Panel title="AUDIO" label="AUDIO / ASSETS">
          <LoadingState label="Loading audio workspace" />
        </Panel>
      </div>
    );
  }

  if (audioAssets.isError) {
    return (
      <Panel title="Audio unavailable" label="AUDIO / ASSETS">
        <ErrorState
          detail="Audio assets could not be loaded from the backend."
          onRetry={() => audioAssets.refetch()}
        />
      </Panel>
    );
  }

  const assets = audioAssets.data ?? [];
  const assetGroups = groupedAudioAssets(assets);

  return (
    <div className="space-y-4">
      <Panel title="AUDIO" label="AUDIO / ASSETS">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground">
              Recordings, mixes, masters, and delivery files for this song.
            </p>
          </div>
          <AudioAssetFormDialog
            songId={songId}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Add Audio Asset
              </Button>
            }
          />
        </div>
        {assets.length ? (
          <div className="mt-4">
            <AudioSummary assets={assets} />
          </div>
        ) : null}
      </Panel>

      {assets.length === 0 ? (
        <EmptyState
          title="NO AUDIO ASSETS"
          detail="Start with a demo, recording, mix, or master."
          action={
            <AudioAssetFormDialog
              songId={songId}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  Add Audio Asset
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="space-y-4">
          {assetGroups.map((group) => (
            <Panel
              key={group.type}
              title={group.type}
              label={`${group.families.length} ${
                group.families.length === 1 ? "FAMILY" : "FAMILIES"
              }`}
            >
              <div className="space-y-5">
                {group.families.map((family, index) => (
                  <section key={family.assetFamilyId} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="label-tech">
                        VERSION FAMILY {group.families.length > 1 ? index + 1 : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {family.assets.length} {family.assets.length === 1 ? "version" : "versions"}
                      </p>
                    </div>
                    {family.assets.map((asset) => (
                      <AudioAssetRow
                        key={asset.id}
                        songId={songId}
                        asset={asset}
                        driveStatus={driveConnection.data}
                        driveStatusError={driveConnection.isError}
                        activeAudioAssetId={activeAudioAssetId}
                        onActivateAudio={setActiveAudioAssetId}
                        onDeactivateAudio={(audioAssetId) => {
                          setActiveAudioAssetId((current) =>
                            current === audioAssetId ? null : current,
                          );
                        }}
                      />
                    ))}
                  </section>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
