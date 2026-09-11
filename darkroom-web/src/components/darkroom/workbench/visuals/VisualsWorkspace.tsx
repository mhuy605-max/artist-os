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

import {
  externalProviderLabel,
  formatFileSize,
  normalizeId,
  numberOrNull,
  parseApiProblemTitle,
  READ_ONLY_SONG_ACCESS,
  releaseReadinessQueryKey,
  type SongAccess,
  visualAssetsQueryKey,
} from "../shared";
import { VisualImagePreview } from "./VisualImagePreview";
import { VisualVideoPreview } from "./VisualVideoPreview";

function useVisualAssetMutations(songId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: visualAssetsQueryKey(songId) });
    queryClient.invalidateQueries({ queryKey: releaseReadinessQueryKey(songId) });
  };

  return {
    create: useMutation({
      mutationFn: (payload: VisualAssetPayload) =>
        visualAssetsApi.createVisualAsset(songId, payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        visualAssetId,
        payload,
      }: {
        visualAssetId: string;
        payload: VisualAssetPayload;
      }) => visualAssetsApi.updateVisualAsset(songId, visualAssetId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (visualAssetId: string) =>
        visualAssetsApi.deleteVisualAsset(songId, visualAssetId),
      onSuccess: invalidate,
    }),
    upload: useMutation({
      mutationFn: ({ visualAssetId, file }: { visualAssetId: string; file: File }) =>
        visualAssetsApi.uploadVisualAssetFile(songId, visualAssetId, file),
      onSuccess: invalidate,
    }),
    createVersion: useMutation({
      mutationFn: (visualAssetId: string) =>
        visualAssetsApi.createVisualAssetVersion(songId, visualAssetId),
      onSuccess: invalidate,
    }),
    replaceFile: useMutation({
      mutationFn: ({ visualAssetId, file }: { visualAssetId: string; file: File }) =>
        visualAssetsApi.replaceVisualAssetFile(songId, visualAssetId, file),
      onSuccess: invalidate,
    }),
  };
}

function isVisualAssetType(value: string): value is VisualAssetType {
  return VISUAL_ASSET_TYPES.includes(value as VisualAssetType);
}

function isVisualAssetStatus(value: string): value is VisualAssetStatus {
  return VISUAL_ASSET_STATUSES.includes(value as VisualAssetStatus);
}

function visualTypeLabel(type: VisualAssetType) {
  return VISUAL_ASSET_TYPE_LABELS[type];
}

function visualStatusLabel(status: VisualAssetStatus) {
  return VISUAL_ASSET_STATUS_LABELS[status];
}

function validateVisualAssetPayload(payload: VisualAssetPayload) {
  const fileName = payload.fileName.trim();
  if (!fileName) return "File name is required.";
  if (fileName.length > 255) return "File name must be 255 characters or fewer.";
  if (!isVisualAssetType(payload.type)) return "Choose a valid type.";
  if (!Number.isInteger(payload.version) || payload.version < 1) {
    return "Version must be a positive whole number.";
  }
  if (!isVisualAssetStatus(payload.status)) return "Choose a valid status.";
  if (payload.width != null && payload.width < 1) return "Width must be a positive number.";
  if (payload.height != null && payload.height < 1) return "Height must be a positive number.";
  if (payload.fileSizeBytes != null && payload.fileSizeBytes < 0) {
    return "File size must be zero or greater.";
  }
  return "";
}

function formatDimensions(width?: number | null, height?: number | null) {
  if (width == null || height == null) return "No dimensions";
  return `${width} × ${height}`;
}

function visualMediaLabel(asset: VisualAsset) {
  const mimeType = asset.linkedFile?.mimeType?.toLowerCase();
  const extension = (asset.linkedFile?.displayName ?? asset.fileName)
    .split(".")
    .pop()
    ?.toUpperCase();

  if (mimeType?.includes("png")) return "PNG";
  if (mimeType?.includes("jpeg") || mimeType?.includes("jpg")) return "JPEG";
  if (mimeType?.includes("webp")) return "WEBP";
  if (mimeType?.includes("mp4")) return "MP4";
  if (mimeType?.includes("quicktime")) return "MOV";
  if (mimeType?.includes("webm")) return "WEBM";

  if (extension && ["PNG", "JPG", "JPEG", "WEBP", "MP4", "MOV", "WEBM"].includes(extension)) {
    return extension === "JPG" ? "JPEG" : extension;
  }

  if (asset.type === "MusicVideo" || asset.type === "Visualizer") return "VIDEO";
  return "VISUAL";
}

function visualUploadErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "";

  if (error instanceof ApiError) {
    const detail = parseApiProblemTitle(error);

    if (error.status === 409 && detail.includes("Google Drive is not connected")) {
      return "Connect storage from Settings before attaching visual files.";
    }

    if (error.status === 409 && detail.includes("authorization needs to be refreshed")) {
      return "Reconnect Google Drive from Settings before uploading.";
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

  return error.message || "The visual file could not be uploaded.";
}

interface VisualAssetFamilyGroup {
  assetFamilyId: string;
  assets: VisualAsset[];
}

function sortVisualVersions(assets: VisualAsset[]) {
  return [...assets].sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return b.version - a.version;
  });
}

function groupedVisualAssets(assets: VisualAsset[]) {
  return VISUAL_ASSET_TYPES.map((type) => ({
    type,
    families: Array.from(
      assets
        .filter((asset) => asset.type === type)
        .reduce((families, asset) => {
          const existing = families.get(asset.assetFamilyId) ?? [];
          existing.push(asset);
          families.set(asset.assetFamilyId, existing);
          return families;
        }, new Map<string, VisualAsset[]>()),
      ([assetFamilyId, familyAssets]): VisualAssetFamilyGroup => ({
        assetFamilyId,
        assets: sortVisualVersions(familyAssets),
      }),
    ).sort((a, b) => {
      const currentA = a.assets.find((asset) => asset.isCurrent) ?? a.assets[0];
      const currentB = b.assets.find((asset) => asset.isCurrent) ?? b.assets[0];
      return (currentB?.version ?? 0) - (currentA?.version ?? 0);
    }),
  })).filter((group) => group.families.length > 0);
}

function VisualSummary({ assets }: { assets: VisualAsset[] }) {
  const linkedCount = assets.filter((asset) => asset.linkedFile).length;
  const finalCount = assets.filter((asset) => asset.status === "Final").length;
  const videoCount = assets.filter(
    (asset) =>
      asset.type === "MusicVideo" ||
      asset.type === "Visualizer" ||
      asset.linkedFile?.mimeType?.toLowerCase().startsWith("video/"),
  ).length;

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      <MetricBlock label="TOTAL" value={assets.length} />
      <MetricBlock label="LINKED" value={linkedCount} />
      <MetricBlock label="FINAL" value={finalCount} />
      <MetricBlock label="VIDEO" value={videoCount} />
    </div>
  );
}

function VisualAssetFormDialog({
  songId,
  asset,
  defaultType = "CoverArt",
  trigger,
}: {
  songId: string;
  asset?: VisualAsset;
  defaultType?: VisualAssetType;
  trigger: ReactNode;
}) {
  const mode = asset ? "edit" : "create";
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState(asset?.fileName ?? "");
  const [type, setType] = useState<VisualAssetType>(asset?.type ?? defaultType);
  const [status, setStatus] = useState<VisualAssetStatus>(asset?.status ?? "Draft");
  const [width, setWidth] = useState(asset?.width == null ? "" : String(asset.width));
  const [height, setHeight] = useState(asset?.height == null ? "" : String(asset.height));
  const [fileSizeMb, setFileSizeMb] = useState(
    asset?.fileSizeBytes == null ? "" : (asset.fileSizeBytes / 1024 / 1024).toFixed(1),
  );
  const [error, setError] = useState("");
  const mutations = useVisualAssetMutations(songId);
  const mutation = mode === "create" ? mutations.create : mutations.update;

  async function submit() {
    const fileSizeMbValue = numberOrNull(fileSizeMb);
    const payload: VisualAssetPayload = {
      type,
      fileName: fileName.trim(),
      version: asset?.version ?? 1,
      status,
      width: numberOrNull(width),
      height: numberOrNull(height),
      fileSizeBytes: fileSizeMbValue == null ? null : Math.round(fileSizeMbValue * 1024 * 1024),
      isCurrent: asset?.isCurrent ?? true,
    };
    const validationError = validateVisualAssetPayload(payload);
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
        setWidth("");
        setHeight("");
        setFileSizeMb("");
      } else if (asset) {
        await mutations.update.mutateAsync({
          visualAssetId: String(asset.id),
          payload,
        });
      }
      setError("");
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The visual asset could not be saved.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === "create" ? "Add visual asset" : "Edit visual asset"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a visual asset slot for cover art, video, canvas, or campaign files. Attach the file after saving."
              : asset?.linkedFile
                ? "Update how this visual version is organized in DARKROOM SYSTEM. This does not rename the linked Drive file."
                : "Update this visual version before a file is attached."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              className="label-tech"
              htmlFor={`${mode}-visual-file-name-${asset?.id ?? "new"}`}
            >
              Asset file name
            </label>
            <Input
              id={`${mode}-visual-file-name-${asset?.id ?? "new"}`}
              value={fileName}
              maxLength={255}
              onChange={(event) => setFileName(event.target.value)}
              className="mt-2"
              placeholder="cover_v3.png"
            />
          </div>
          <div>
            <label className="label-tech">Type</label>
            <Select value={type} onValueChange={(value) => setType(value as VisualAssetType)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISUAL_ASSET_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {visualTypeLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as VisualAssetStatus)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISUAL_ASSET_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {visualStatusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-visual-width-${asset?.id ?? "new"}`}>
              Width
            </label>
            <Input
              id={`${mode}-visual-width-${asset?.id ?? "new"}`}
              type="number"
              min={1}
              step={1}
              value={width}
              onChange={(event) => setWidth(event.target.value)}
              className="mt-2"
              placeholder="3000"
            />
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-visual-height-${asset?.id ?? "new"}`}>
              Height
            </label>
            <Input
              id={`${mode}-visual-height-${asset?.id ?? "new"}`}
              type="number"
              min={1}
              step={1}
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              className="mt-2"
              placeholder="3000"
            />
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-visual-size-${asset?.id ?? "new"}`}>
              File size
            </label>
            <Input
              id={`${mode}-visual-size-${asset?.id ?? "new"}`}
              type="number"
              min={0}
              step="0.1"
              value={fileSizeMb}
              onChange={(event) => setFileSizeMb(event.target.value)}
              className="mt-2"
              placeholder="8.4"
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

function CreateVisualVersionDialog({
  asset,
  createVersion,
  trigger,
}: {
  asset: VisualAsset;
  createVersion: {
    isPending: boolean;
    error: unknown;
    mutate: (visualAssetId: string) => void;
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

function ReplaceVisualFileDialog({
  asset,
  replaceFile,
  trigger,
}: {
  asset: VisualAsset;
  replaceFile: {
    isPending: boolean;
    error: unknown;
    mutate: (input: { visualAssetId: string; file: File }) => void;
  };
  trigger: ReactNode;
}) {
  const fileInputId = useId();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function replace() {
    if (!selectedFile) return;
    replaceFile.mutate({ visualAssetId: String(asset.id), file: selectedFile });
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
              Replacement visual file
            </label>
            <Input
              id={fileInputId}
              className="mt-2 text-xs"
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.mp4,.mov,.webm,image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
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
            <p className="text-sm text-destructive">
              {visualUploadErrorMessage(replaceFile.error)}
            </p>
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

function VisualFileAssociationPanel({
  songId,
  asset,
  driveStatus,
  driveStatusError,
  upload,
  replaceFile,
  access,
  activeVideoAssetId,
  onVideoActivate,
  onVideoDeactivate,
}: {
  songId: string;
  asset: VisualAsset;
  driveStatus?: GoogleDriveConnectionStatus;
  driveStatusError: boolean;
  upload: {
    isPending: boolean;
    error: unknown;
    mutate: (input: { visualAssetId: string; file: File }) => void;
  };
  replaceFile: {
    isPending: boolean;
    error: unknown;
    mutate: (input: { visualAssetId: string; file: File }) => void;
  };
  access: SongAccess;
  activeVideoAssetId: string | null;
  onVideoActivate: (visualAssetId: string) => void;
  onVideoDeactivate: (visualAssetId: string) => void;
}) {
  const fileInputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const linkedFile = asset.linkedFile;
  const assetId = String(asset.id);

  if (linkedFile) {
    return (
      <div className="border border-border bg-panel p-3">
        <VisualImagePreview songId={songId} asset={asset} />
        <VisualVideoPreview
          songId={songId}
          asset={asset}
          isActive={activeVideoAssetId === assetId}
          onActivate={() => onVideoActivate(assetId)}
          onDeactivate={() => onVideoDeactivate(assetId)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="label-tech">FILE LINKED</p>
              <span className="border border-border px-2 py-1 text-xs">
                {visualMediaLabel(asset)}
              </span>
            </div>
            <p className="mt-2 break-words text-sm font-medium">{linkedFile.displayName}</p>
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
          {access.canEdit ? (
            <ReplaceVisualFileDialog
              asset={asset}
              replaceFile={replaceFile}
              trigger={
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                  Replace File
                </Button>
              }
            />
          ) : null}
        </div>
      </div>
    );
  }

  if (!access.canEdit) {
    return (
      <div className="border border-dashed border-border bg-panel p-3">
        <p className="label-tech">VIEW ONLY</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This version has no linked visual file yet.
        </p>
      </div>
    );
  }

  const shouldUseOwnerDriveStatus = access.isOwner;

  if (shouldUseOwnerDriveStatus && driveStatus?.connected === false) {
    return (
      <div className="border border-dashed border-border bg-panel p-3">
        <p className="label-tech">CONNECT STORAGE TO UPLOAD</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Google Drive must be connected before attaching visual files.
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link to="/settings">Open Settings</Link>
        </Button>
      </div>
    );
  }

  if (shouldUseOwnerDriveStatus && driveStatus?.status === "ReauthRequired") {
    return (
      <div className="border border-dashed border-border bg-panel p-3">
        <p className="label-tech">STORAGE CONNECTION NEEDS ATTENTION</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reconnect Google Drive from Settings before uploading.
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link to="/settings">Open Settings</Link>
        </Button>
      </div>
    );
  }

  if (shouldUseOwnerDriveStatus && !driveStatus && !driveStatusError) {
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
            UPLOAD FILE
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Images: PNG, JPG, WEBP / up to 100 MB
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Video: MP4, MOV, WEBM / up to 2 GB</p>
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
            accept=".png,.jpg,.jpeg,.webp,.mp4,.mov,.webm,image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
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
                  visualAssetId: String(asset.id),
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
        <p className="mt-2 text-xs text-destructive">{visualUploadErrorMessage(upload.error)}</p>
      ) : null}
    </div>
  );
}

function VisualAssetRow({
  songId,
  asset,
  driveStatus,
  driveStatusError,
  activeVideoAssetId,
  onVideoActivate,
  onVideoDeactivate,
  access,
}: {
  songId: string;
  asset: VisualAsset;
  driveStatus?: GoogleDriveConnectionStatus;
  driveStatusError: boolean;
  activeVideoAssetId: string | null;
  onVideoActivate: (visualAssetId: string) => void;
  onVideoDeactivate: (visualAssetId: string) => void;
  access: SongAccess;
}) {
  const mutations = useVisualAssetMutations(songId);
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
            <span className="border border-border px-2 py-1 text-xs">
              {visualMediaLabel(asset)}
            </span>
            <p className="label-tech">
              {visualTypeLabel(asset.type)} / V{asset.version}
            </p>
            {asset.isCurrent ? (
              <span className="border border-border px-2 py-1 text-xs uppercase">Current</span>
            ) : null}
            <StatusBadge status={visualStatusLabel(asset.status)} />
          </div>
          <p className="mt-3 break-words text-base font-semibold">
            {asset.fileName || "No file attached yet"}
          </p>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <p>
              <span className="label-tech block">DIMENSIONS</span>
              {formatDimensions(asset.width, asset.height)}
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
          {access.canEdit ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <VisualAssetFormDialog
                songId={songId}
                asset={asset}
                trigger={
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                }
              />
              <CreateVisualVersionDialog
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
                    <AlertDialogTitle>Remove visual asset?</AlertDialogTitle>
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
          ) : null}
        </div>
        <VisualFileAssociationPanel
          songId={songId}
          asset={asset}
          driveStatus={driveStatus}
          driveStatusError={driveStatusError}
          activeVideoAssetId={activeVideoAssetId}
          onVideoActivate={onVideoActivate}
          onVideoDeactivate={onVideoDeactivate}
          upload={mutations.upload}
          replaceFile={mutations.replaceFile}
          access={access}
        />
      </div>
    </article>
  );
}

export function VisualsWorkspace({
  songId,
  access = READ_ONLY_SONG_ACCESS,
}: {
  songId: string;
  access?: SongAccess;
}) {
  const [activeVideoAssetId, setActiveVideoAssetId] = useState<string | null>(null);
  const visualAssets = useQuery({
    queryKey: visualAssetsQueryKey(songId),
    queryFn: () => visualAssetsApi.getVisualAssets(songId),
  });
  const driveConnection = useQuery({
    queryKey: googleDriveConnectionQueryKey,
    queryFn: googleDriveApi.getStatus,
    enabled: access.isOwner,
  });

  if (visualAssets.isLoading) {
    return (
      <div className="space-y-4">
        <Panel title="VISUALS" label="VISUALS / ASSETS">
          <LoadingState label="Loading visuals workspace" />
        </Panel>
      </div>
    );
  }

  if (visualAssets.isError) {
    return (
      <Panel title="Visuals unavailable" label="VISUALS / ASSETS">
        <ErrorState
          detail="We couldn't load visual assets."
          onRetry={() => visualAssets.refetch()}
        />
      </Panel>
    );
  }

  const assets = visualAssets.data ?? [];
  const assetGroups = groupedVisualAssets(assets);

  return (
    <div className="space-y-4">
      <Panel title="VISUALS" label="VISUALS / ASSETS">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground">
              Artwork, video, campaign, and social assets for this song.
            </p>
          </div>
          {access.canEdit ? (
            <VisualAssetFormDialog
              songId={songId}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  Add Visual Asset
                </Button>
              }
            />
          ) : null}
        </div>
        {assets.length ? (
          <div className="mt-4">
            <VisualSummary assets={assets} />
          </div>
        ) : null}
      </Panel>

      {assets.length === 0 ? (
        <EmptyState
          title="NO VISUAL ASSETS"
          detail="Start with cover art, video, canvas, or campaign assets."
          action={
            access.canEdit ? (
              <VisualAssetFormDialog
                songId={songId}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4" />
                    Add Visual Asset
                  </Button>
                }
              />
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {assetGroups.map((group) => (
            <Panel
              key={group.type}
              title={visualTypeLabel(group.type)}
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
                      <VisualAssetRow
                        key={asset.id}
                        songId={songId}
                        asset={asset}
                        driveStatus={driveConnection.data}
                        driveStatusError={driveConnection.isError}
                        activeVideoAssetId={activeVideoAssetId}
                        onVideoActivate={setActiveVideoAssetId}
                        access={access}
                        onVideoDeactivate={(visualAssetId) =>
                          setActiveVideoAssetId((current) =>
                            current === visualAssetId ? null : current,
                          )
                        }
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
