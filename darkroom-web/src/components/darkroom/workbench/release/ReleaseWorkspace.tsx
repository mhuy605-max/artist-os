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
import { teamMembers } from "@/services/mock/team";
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

import { normalizeId, releaseChecklistQueryKey, releaseQueryKey } from "../shared";
import { Info } from "../shared-ui";

function useReleaseMutations(songId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: releaseQueryKey(songId) });
    queryClient.invalidateQueries({ queryKey: releaseChecklistQueryKey(songId) });
  };

  return {
    create: useMutation({
      mutationFn: (payload: ReleasePayload) => releasesApi.createRelease(songId, payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (payload: ReleasePayload) => releasesApi.updateRelease(songId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: () => releasesApi.deleteRelease(songId),
      onSuccess: invalidate,
    }),
  };
}

function useReleaseChecklistMutations(songId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: releaseChecklistQueryKey(songId) });

  return {
    update: useMutation({
      mutationFn: ({
        checklistItemId,
        payload,
      }: {
        checklistItemId: string;
        payload: ReleaseChecklistItemPayload;
      }) => releaseChecklistApi.updateChecklistItem(songId, checklistItemId, payload),
      onSuccess: invalidate,
    }),
  };
}

function isReleaseType(value: string): value is ReleaseType {
  return RELEASE_TYPES.includes(value as ReleaseType);
}

function isReleaseStatus(value: string): value is ReleaseStatus {
  return RELEASE_STATUSES.includes(value as ReleaseStatus);
}

function isReleasePlatform(value: string): value is ReleasePlatform {
  return RELEASE_PLATFORMS.includes(value as ReleasePlatform);
}

function releaseTypeLabel(type: ReleaseType) {
  return RELEASE_TYPE_LABELS[type];
}

function releaseStatusLabel(status: ReleaseStatus) {
  return RELEASE_STATUS_LABELS[status];
}

function platformLabel(platform: ReleasePlatform) {
  return RELEASE_PLATFORM_LABELS[platform];
}

function releaseDateLabel(releaseDate?: string | null) {
  return releaseDate ? formatDate(releaseDate) : "DATE NOT SET";
}

function optionalReleaseValue(value?: string | null) {
  return value?.trim() ? value : "Not set";
}

function releaseReadiness(items: ReleaseChecklistItem[]) {
  const completedCount = items.filter((item) => item.isCompleted).length;
  const progressPercent = items.length ? Math.round((completedCount / items.length) * 100) : 0;
  const nextItem = items.find((item) => !item.isCompleted);

  return {
    completedCount,
    progressPercent,
    nextItem,
  };
}

function validateReleasePayload(payload: ReleasePayload) {
  if (!isReleaseType(payload.releaseType)) return "Choose a valid release type.";
  if (!isReleaseStatus(payload.status)) return "Choose a valid release status.";
  if (payload.distributor && payload.distributor.trim().length > 120) {
    return "Distributor must be 120 characters or fewer.";
  }
  if (payload.isrc && payload.isrc.trim().length > 20) {
    return "ISRC must be 20 characters or fewer.";
  }
  if (payload.upc && payload.upc.trim().length > 20) return "UPC must be 20 characters or fewer.";
  if (!payload.platforms.every(isReleasePlatform)) return "Choose valid platforms.";
  return "";
}

function ReleaseFormDialog({
  songId,
  release,
  trigger,
}: {
  songId: string;
  release?: Release | null;
  trigger: ReactNode;
}) {
  const mode = release ? "edit" : "create";
  const mutations = useReleaseMutations(songId);
  const mutation = mode === "create" ? mutations.create : mutations.update;
  const [open, setOpen] = useState(false);
  const [releaseDate, setReleaseDate] = useState(release?.releaseDate ?? "");
  const [releaseType, setReleaseType] = useState<ReleaseType>(release?.releaseType ?? "Single");
  const [distributor, setDistributor] = useState(release?.distributor ?? "");
  const [isrc, setIsrc] = useState(release?.isrc ?? "");
  const [upc, setUpc] = useState(release?.upc ?? "");
  const [status, setStatus] = useState<ReleaseStatus>(release?.status ?? "Planning");
  const [platforms, setPlatforms] = useState<ReleasePlatform[]>(release?.platforms ?? []);
  const [error, setError] = useState("");

  function togglePlatform(platform: ReleasePlatform, checked: boolean) {
    setPlatforms((current) =>
      checked ? [...current, platform] : current.filter((item) => item !== platform),
    );
  }

  async function submit() {
    const payload: ReleasePayload = {
      releaseDate: releaseDate || null,
      releaseType,
      distributor: distributor.trim() || null,
      isrc: isrc.trim() || null,
      upc: upc.trim() || null,
      status,
      platforms,
    };
    const validationError = validateReleasePayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await mutation.mutateAsync(payload);
      setError("");
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The release plan could not be saved.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === "create" ? "Set up release" : "Edit release"}
          </DialogTitle>
          <DialogDescription>
            Save release planning metadata and intended platforms. This does not submit anything to
            a distributor.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-tech" htmlFor={`${mode}-release-date-${songId}`}>
              Release date
            </label>
            <Input
              id={`${mode}-release-date-${songId}`}
              type="date"
              value={releaseDate}
              onChange={(event) => setReleaseDate(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label className="label-tech">Release type</label>
            <div className="mt-2 border border-border bg-panel px-3 py-2 text-sm">
              {releaseTypeLabel(releaseType)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Only Single is supported now.</p>
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-release-distributor-${songId}`}>
              Distributor
            </label>
            <Input
              id={`${mode}-release-distributor-${songId}`}
              value={distributor}
              maxLength={120}
              onChange={(event) => setDistributor(event.target.value)}
              className="mt-2"
              placeholder="DISTROKID"
            />
          </div>
          <div>
            <label className="label-tech">Release status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as ReleaseStatus)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELEASE_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {releaseStatusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-release-isrc-${songId}`}>
              ISRC
            </label>
            <Input
              id={`${mode}-release-isrc-${songId}`}
              value={isrc}
              maxLength={20}
              onChange={(event) => setIsrc(event.target.value)}
              className="mt-2"
              placeholder="QZK4S260001"
            />
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-release-upc-${songId}`}>
              UPC
            </label>
            <Input
              id={`${mode}-release-upc-${songId}`}
              value={upc}
              maxLength={20}
              onChange={(event) => setUpc(event.target.value)}
              className="mt-2"
              placeholder="191227000000"
            />
          </div>
          <div className="sm:col-span-2">
            <p className="label-tech" id={`${mode}-release-platforms-${songId}`}>
              Platforms
            </p>
            <div
              className="mt-2 grid gap-2 sm:grid-cols-2"
              role="group"
              aria-labelledby={`${mode}-release-platforms-${songId}`}
            >
              {RELEASE_PLATFORMS.map((platform) => (
                <label
                  key={platform}
                  className={cn(
                    "flex items-center gap-2 border border-border bg-panel px-3 py-2 text-sm",
                    platforms.includes(platform) && "border-border-strong bg-panel-strong",
                  )}
                >
                  <Checkbox
                    checked={platforms.includes(platform)}
                    onCheckedChange={(checked) => togglePlatform(platform, checked === true)}
                  />
                  {platformLabel(platform)}
                </label>
              ))}
            </div>
          </div>
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

export function ReleaseWorkspace({ songId }: { songId: string }) {
  const release = useQuery({
    queryKey: releaseQueryKey(songId),
    queryFn: () => releasesApi.getRelease(songId),
  });
  const checklist = useQuery({
    queryKey: releaseChecklistQueryKey(songId),
    queryFn: () => releaseChecklistApi.getChecklist(songId),
    enabled: Boolean(release.data),
  });
  const mutations = useReleaseMutations(songId);

  if (release.isLoading) {
    return (
      <Panel title="RELEASE" label="RELEASE / CONTROL">
        <LoadingState label="Loading release control room" />
      </Panel>
    );
  }

  if (release.isError) {
    return (
      <Panel title="Release unavailable" label="RELEASE / CONTROL">
        <ErrorState
          detail="We couldn't load release information."
          onRetry={() => release.refetch()}
        />
      </Panel>
    );
  }

  const releasePlan = release.data;

  if (!releasePlan) {
    return (
      <Panel title="RELEASE" label="RELEASE / CONTROL">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground">
              Release planning, metadata, and preparation readiness.
            </p>
          </div>
          <ReleaseFormDialog
            songId={songId}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Set Up Release
              </Button>
            }
          />
        </div>
        <div className="mt-5 border border-dashed border-border bg-background p-6">
          <p className="label-tech">NO RELEASE SET UP</p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Set the release date, distributor, platforms, and preparation checklist.
          </p>
        </div>
      </Panel>
    );
  }

  const checklistItems = checklist.data ?? [];
  const readiness = releaseReadiness(checklistItems);

  return (
    <div className="space-y-4">
      <Panel title="RELEASE" label="RELEASE / CONTROL">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground">
              Release planning, metadata, and preparation readiness.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ReleaseFormDialog
              songId={songId}
              release={releasePlan}
              trigger={<Button variant="outline">Edit Release</Button>}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove release setup?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the release metadata and preparation checklist from DARKROOM
                    SYSTEM. The Song remains.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => mutations.remove.mutate()}>
                    Remove Release
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <Panel title="Release state" label="RELEASE STATE">
            <ReleaseStateRows release={releasePlan} />
          </Panel>

          <Panel title="Release details" label="RELEASE DETAILS">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Distributor" value={optionalReleaseValue(releasePlan.distributor)} />
              <Info
                label="Platforms"
                value={
                  releasePlan.platforms.length
                    ? `${releasePlan.platforms.length} selected`
                    : "Not set"
                }
              />
              <Info label="ISRC" value={optionalReleaseValue(releasePlan.isrc)} />
              <Info label="UPC" value={optionalReleaseValue(releasePlan.upc)} />
              <Info label="Created" value={formatDate(releasePlan.createdAt)} />
              <Info label="Updated" value={formatDate(releasePlan.updatedAt)} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {releasePlan.platforms.length ? (
                releasePlan.platforms.map((platform) => (
                  <span key={platform} className="border border-border px-2 py-1 text-xs">
                    {platformLabel(platform)}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No platforms selected.</span>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Readiness" label="READINESS">
            {checklist.isLoading ? (
              <LoadingState label="Loading preparation readiness" />
            ) : checklist.isError ? (
              <ErrorState
                detail="Release checklist could not be loaded."
                onRetry={() => checklist.refetch()}
              />
            ) : (
              <ReleaseReadinessPanel items={checklistItems} readiness={readiness} />
            )}
          </Panel>

          <ReleaseChecklistPanel
            songId={songId}
            items={checklistItems}
            isLoading={checklist.isLoading}
            isError={checklist.isError}
            onRetry={() => checklist.refetch()}
          />
        </div>
      </div>
    </div>
  );
}

function ReleaseReadinessPanel({
  items,
  readiness,
}: {
  items: ReleaseChecklistItem[];
  readiness: ReturnType<typeof releaseReadiness>;
}) {
  const total = items.length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-3xl">
            {readiness.completedCount} / {total} COMPLETE
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {readiness.progressPercent}% preparation readiness
          </p>
        </div>
        <div
          className="h-2 w-full bg-muted sm:w-48"
          role="progressbar"
          aria-label={`${readiness.completedCount} of ${total} release checklist items complete`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={readiness.completedCount}
        >
          <div
            className="h-full bg-foreground"
            style={{ width: `${readiness.progressPercent}%` }}
            aria-hidden="true"
          />
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <p className="label-tech">NEXT ATTENTION</p>
        <p className="mt-2 text-sm font-medium">
          {readiness.nextItem
            ? `Complete ${readiness.nextItem.label}`
            : "ALL CHECKLIST ITEMS COMPLETE"}
        </p>
      </div>
    </div>
  );
}

function ReleaseStateRows({ release }: { release: Release }) {
  return (
    <dl className="grid gap-2">
      <div className="border border-border bg-background px-3 py-2">
        <dt className="label-tech">STATUS</dt>
        <dd className="mt-1 text-base font-semibold uppercase">
          {releaseStatusLabel(release.status)}
        </dd>
      </div>
      <div className="border border-border bg-background px-3 py-2">
        <dt className="label-tech">RELEASE DATE</dt>
        <dd className="mt-1 text-base font-semibold uppercase">
          {releaseDateLabel(release.releaseDate)}
        </dd>
      </div>
      <div className="border border-border bg-background px-3 py-2">
        <dt className="label-tech">TYPE</dt>
        <dd className="mt-1 text-base font-semibold uppercase">
          {releaseTypeLabel(release.releaseType)}
        </dd>
      </div>
    </dl>
  );
}

function ReleaseChecklistPanel({
  songId,
  items,
  isLoading,
  isError,
  onRetry,
}: {
  songId: string;
  items: ReleaseChecklistItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const mutations = useReleaseChecklistMutations(songId);

  return (
    <Panel title="Preparation checklist" label="PREPARATION CHECKLIST">
      {isLoading ? <LoadingState label="Loading release checklist" /> : null}
      {isError ? (
        <ErrorState detail="Release checklist could not be loaded." onRetry={onRetry} />
      ) : null}
      {!isLoading && !isError ? (
        <div className="grid gap-2">
          {items.map((item) => (
            <ReleaseChecklistItemRow
              key={item.id}
              item={item}
              isPending={mutations.update.isPending}
              onUpdate={(payload) =>
                mutations.update.mutateAsync({
                  checklistItemId: String(item.id),
                  payload,
                })
              }
            />
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

function ReleaseChecklistItemRow({
  item,
  isPending,
  onUpdate,
}: {
  item: ReleaseChecklistItem;
  isPending: boolean;
  onUpdate: (payload: ReleaseChecklistItemPayload) => Promise<unknown>;
}) {
  const [notes, setNotes] = useState(item.notes ?? "");
  const [error, setError] = useState("");
  const trimmedNotes = notes.trim();
  const savedNotes = item.notes ?? "";
  const noteChanged = trimmedNotes !== savedNotes;

  async function updateCompletion(checked: boolean) {
    try {
      setError("");
      await onUpdate({
        isCompleted: checked,
        notes: trimmedNotes || null,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checklist item could not be updated.");
    }
  }

  async function saveNotes() {
    if (notes.length > 1000) {
      setError("Notes must be 1000 characters or fewer.");
      return;
    }

    try {
      setError("");
      await onUpdate({
        isCompleted: item.isCompleted,
        notes: trimmedNotes || null,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checklist notes could not be saved.");
    }
  }

  return (
    <div className="border border-border bg-background p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Checkbox
            aria-label={`${item.label} checklist item`}
            checked={item.isCompleted}
            disabled={isPending}
            onCheckedChange={(checked) => updateCompletion(checked === true)}
            className="mt-1"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium">{item.label}</p>
            <p className="mt-1 text-xs uppercase text-muted-foreground">
              {item.isCompleted && item.completedAt
                ? `Completed ${formatDate(item.completedAt)}`
                : "Open"}
            </p>
            {savedNotes ? (
              <p className="mt-2 max-w-xl break-words text-xs text-muted-foreground">
                {savedNotes}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {isPending ? <span className="text-xs text-muted-foreground">Saving</span> : null}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                {savedNotes ? "Edit note" : "Add note"}
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-background">
              <DialogHeader>
                <DialogTitle className="uppercase">{item.label} note</DialogTitle>
                <DialogDescription>
                  Save manual preparation notes for this checklist item.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                aria-label={`${item.label} note`}
                value={notes}
                maxLength={1000}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional checklist notes"
                className="min-h-28"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">{notes.length} / 1000</p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!noteChanged || isPending}
                  onClick={saveNotes}
                >
                  Save note
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
