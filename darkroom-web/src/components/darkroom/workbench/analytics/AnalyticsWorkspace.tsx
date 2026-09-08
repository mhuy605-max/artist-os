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

import { analyticsSnapshotsQueryKey, normalizeId } from "../shared";

function useAnalyticsSnapshotMutations(songId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: analyticsSnapshotsQueryKey(songId) });

  return {
    create: useMutation({
      mutationFn: (payload: AnalyticsSnapshotPayload) =>
        analyticsApi.createAnalyticsSnapshot(songId, payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        analyticsSnapshotId,
        payload,
      }: {
        analyticsSnapshotId: string;
        payload: AnalyticsSnapshotPayload;
      }) => analyticsApi.updateAnalyticsSnapshot(songId, analyticsSnapshotId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (analyticsSnapshotId: string) =>
        analyticsApi.deleteAnalyticsSnapshot(songId, analyticsSnapshotId),
      onSuccess: invalidate,
    }),
  };
}

function isAnalyticsPlatform(value: string): value is AnalyticsPlatform {
  return ANALYTICS_PLATFORMS.includes(value as AnalyticsPlatform);
}

function analyticsPlatformLabel(platform: AnalyticsPlatform) {
  return ANALYTICS_PLATFORM_LABELS[platform];
}

function wholeNumberOrZero(value: string) {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : -1;
}

function validateAnalyticsSnapshotPayload(payload: AnalyticsSnapshotPayload) {
  if (!isAnalyticsPlatform(payload.platform)) return "Choose a valid platform.";
  if (!payload.snapshotDate) return "Snapshot date is required.";
  const metrics = [
    payload.views,
    payload.likes,
    payload.comments,
    payload.watchTimeMinutes,
    payload.subscribersGained,
  ];
  if (metrics.some((metric) => !Number.isInteger(metric) || metric < 0)) {
    return "Metrics must be non-negative whole numbers.";
  }
  return "";
}

function formatWatchTime(minutes: number) {
  const hours = minutes / 60;
  if (hours < 1) return `${formatNumber(minutes)}m`;
  return `${formatNumber(Math.round(hours))}h`;
}

function formatAnalyticsWatchTime(minutes: number) {
  return `${formatMetricNumber(minutes)} minutes`;
}

function formatMetricNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function analyticsSaveErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    return "A snapshot already exists for this platform and snapshot date.";
  }

  return error instanceof Error ? error.message : "The performance snapshot could not be saved.";
}

function sortAnalyticsSnapshots(analyticsSnapshots: AnalyticsSnapshot[]) {
  return [...analyticsSnapshots].sort((a, b) => {
    const dateComparison = a.snapshotDate.localeCompare(b.snapshotDate);
    if (dateComparison !== 0) return dateComparison;

    const platformComparison = analyticsPlatformLabel(a.platform).localeCompare(
      analyticsPlatformLabel(b.platform),
    );
    if (platformComparison !== 0) return platformComparison;

    return String(a.id).localeCompare(String(b.id));
  });
}

function latestAnalyticsByPlatform(analyticsSnapshots: AnalyticsSnapshot[]) {
  const latest = new Map<AnalyticsPlatform, AnalyticsSnapshot>();

  for (const snapshot of analyticsSnapshots) {
    const current = latest.get(snapshot.platform);
    if (
      !current ||
      snapshot.snapshotDate > current.snapshotDate ||
      (snapshot.snapshotDate === current.snapshotDate && snapshot.createdAt > current.createdAt)
    ) {
      latest.set(snapshot.platform, snapshot);
    }
  }

  return Array.from(latest.values()).sort((a, b) =>
    analyticsPlatformLabel(a.platform).localeCompare(analyticsPlatformLabel(b.platform)),
  );
}

function recordedAnalyticsPlatforms(analyticsSnapshots: AnalyticsSnapshot[]) {
  return Array.from(new Set(analyticsSnapshots.map((snapshot) => snapshot.platform))).sort((a, b) =>
    analyticsPlatformLabel(a).localeCompare(analyticsPlatformLabel(b)),
  );
}

function previousSnapshotForPlatform(
  snapshot: AnalyticsSnapshot,
  chronologicalSnapshots: AnalyticsSnapshot[],
) {
  const previous = chronologicalSnapshots
    .filter(
      (candidate) =>
        candidate.platform === snapshot.platform &&
        (candidate.snapshotDate < snapshot.snapshotDate ||
          (candidate.snapshotDate === snapshot.snapshotDate &&
            String(candidate.id) < String(snapshot.id))),
    )
    .at(-1);

  return previous ?? null;
}

function formatMetricChange(current: number, previous?: number) {
  if (previous == null) return "First recorded snapshot";

  const change = current - previous;
  if (change === 0) return "No change since previous snapshot";

  return `${change > 0 ? "+" : "-"}${formatMetricNumber(Math.abs(change))} since previous snapshot`;
}

function AnalyticsMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-panel p-3">
      <dt className="label-tech">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
    </div>
  );
}

function AnalyticsLoadingState() {
  return (
    <div className="space-y-4" aria-label="Loading performance snapshots">
      <Panel title="ANALYTICS" label="ANALYTICS / PERFORMANCE">
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse bg-panel-strong" />
          <div className="h-4 w-1/3 animate-pulse bg-panel-strong" />
        </div>
      </Panel>
      <Panel title="Latest performance" label="LATEST PERFORMANCE">
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="border border-border bg-background p-4">
              <div className="h-4 w-20 animate-pulse bg-panel-strong" />
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[0, 1, 2, 3].map((metric) => (
                  <div key={metric} className="h-16 animate-pulse border border-border bg-panel" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Performance history" label="PERFORMANCE HISTORY">
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse border border-border bg-background" />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AnalyticsSnapshotFormDialog({
  songId,
  snapshot,
  trigger,
}: {
  songId: string;
  snapshot?: AnalyticsSnapshot;
  trigger: ReactNode;
}) {
  const mode = snapshot ? "edit" : "create";
  const mutations = useAnalyticsSnapshotMutations(songId);
  const mutation = mode === "create" ? mutations.create : mutations.update;
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<AnalyticsPlatform>(snapshot?.platform ?? "YouTube");
  const [snapshotDate, setSnapshotDate] = useState(snapshot?.snapshotDate ?? "");
  const [views, setViews] = useState(snapshot ? String(snapshot.views) : "0");
  const [likes, setLikes] = useState(snapshot ? String(snapshot.likes) : "0");
  const [comments, setComments] = useState(snapshot ? String(snapshot.comments) : "0");
  const [watchTimeMinutes, setWatchTimeMinutes] = useState(
    snapshot ? String(snapshot.watchTimeMinutes) : "0",
  );
  const [subscribersGained, setSubscribersGained] = useState(
    snapshot ? String(snapshot.subscribersGained) : "0",
  );
  const [error, setError] = useState("");

  async function submit() {
    const payload: AnalyticsSnapshotPayload = {
      platform,
      snapshotDate,
      views: wholeNumberOrZero(views),
      likes: wholeNumberOrZero(likes),
      comments: wholeNumberOrZero(comments),
      watchTimeMinutes: wholeNumberOrZero(watchTimeMinutes),
      subscribersGained: wholeNumberOrZero(subscribersGained),
    };
    const validationError = validateAnalyticsSnapshotPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (mode === "create") {
        await mutations.create.mutateAsync(payload);
        setPlatform("YouTube");
        setSnapshotDate("");
        setViews("0");
        setLikes("0");
        setComments("0");
        setWatchTimeMinutes("0");
        setSubscribersGained("0");
      } else if (snapshot) {
        await mutations.update.mutateAsync({
          analyticsSnapshotId: String(snapshot.id),
          payload,
        });
      }
      setError("");
      setOpen(false);
    } catch (caught) {
      setError(analyticsSaveErrorMessage(caught));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === "create" ? "Add performance snapshot" : "Edit performance snapshot"}
          </DialogTitle>
          <DialogDescription>
            Record platform metrics for a specific date. Snapshot date is the measurement date.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-tech">Platform</label>
            <Select
              value={platform}
              onValueChange={(value) => setPlatform(value as AnalyticsPlatform)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANALYTICS_PLATFORMS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {analyticsPlatformLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label
              className="label-tech"
              htmlFor={`${mode}-analytics-date-${snapshot?.id ?? "new"}`}
            >
              Snapshot date
            </label>
            <Input
              id={`${mode}-analytics-date-${snapshot?.id ?? "new"}`}
              type="date"
              value={snapshotDate}
              onChange={(event) => setSnapshotDate(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label
              className="label-tech"
              htmlFor={`${mode}-analytics-views-${snapshot?.id ?? "new"}`}
            >
              Views
            </label>
            <Input
              id={`${mode}-analytics-views-${snapshot?.id ?? "new"}`}
              type="number"
              min="0"
              step="1"
              value={views}
              onChange={(event) => setViews(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label
              className="label-tech"
              htmlFor={`${mode}-analytics-likes-${snapshot?.id ?? "new"}`}
            >
              Likes
            </label>
            <Input
              id={`${mode}-analytics-likes-${snapshot?.id ?? "new"}`}
              type="number"
              min="0"
              step="1"
              value={likes}
              onChange={(event) => setLikes(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label
              className="label-tech"
              htmlFor={`${mode}-analytics-comments-${snapshot?.id ?? "new"}`}
            >
              Comments
            </label>
            <Input
              id={`${mode}-analytics-comments-${snapshot?.id ?? "new"}`}
              type="number"
              min="0"
              step="1"
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label
              className="label-tech"
              htmlFor={`${mode}-analytics-watch-${snapshot?.id ?? "new"}`}
            >
              Watch time minutes
            </label>
            <Input
              id={`${mode}-analytics-watch-${snapshot?.id ?? "new"}`}
              type="number"
              min="0"
              step="1"
              value={watchTimeMinutes}
              onChange={(event) => setWatchTimeMinutes(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label
              className="label-tech"
              htmlFor={`${mode}-analytics-subscribers-${snapshot?.id ?? "new"}`}
            >
              Subscribers gained
            </label>
            <Input
              id={`${mode}-analytics-subscribers-${snapshot?.id ?? "new"}`}
              type="number"
              min="0"
              step="1"
              value={subscribersGained}
              onChange={(event) => setSubscribersGained(event.target.value)}
              className="mt-2"
            />
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

function AnalyticsSnapshotRow({
  songId,
  snapshot,
  previousSnapshot,
}: {
  songId: string;
  snapshot: AnalyticsSnapshot;
  previousSnapshot: AnalyticsSnapshot | null;
}) {
  const mutations = useAnalyticsSnapshotMutations(songId);

  return (
    <article className="grid gap-4 border border-border bg-background p-4 xl:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label-tech">Snapshot date</p>
            <p className="mt-1 text-sm font-semibold">{formatDate(snapshot.snapshotDate)}</p>
          </div>
          <p className="border border-border px-2 py-1 text-xs font-medium uppercase">
            {analyticsPlatformLabel(snapshot.platform)}
          </p>
        </div>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <AnalyticsMetric label="Views" value={formatMetricNumber(snapshot.views)} />
          <AnalyticsMetric label="Likes" value={formatMetricNumber(snapshot.likes)} />
          <AnalyticsMetric label="Comments" value={formatMetricNumber(snapshot.comments)} />
          <AnalyticsMetric
            label="Watch time"
            value={formatAnalyticsWatchTime(snapshot.watchTimeMinutes)}
          />
          <AnalyticsMetric
            label="Subscribers gained"
            value={formatMetricNumber(snapshot.subscribersGained)}
          />
        </dl>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <p>{formatMetricChange(snapshot.views, previousSnapshot?.views)}</p>
          <p>Recorded in DARKROOM SYSTEM {formatDate(snapshot.createdAt)}</p>
        </div>
      </div>
      <div className="flex items-start gap-2 xl:justify-end">
        <AnalyticsSnapshotFormDialog
          songId={songId}
          snapshot={snapshot}
          trigger={
            <Button variant="outline" size="sm">
              Edit
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
              <AlertDialogTitle>Remove performance snapshot?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the recorded performance data from DARKROOM SYSTEM. External platform
                analytics are not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => mutations.remove.mutate(String(snapshot.id))}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  );
}

export function AnalyticsWorkspace({ songId }: { songId: string }) {
  const [platformFilter, setPlatformFilter] = useState<AnalyticsPlatform | "All">("All");
  const snapshots = useQuery({
    queryKey: analyticsSnapshotsQueryKey(songId),
    queryFn: () => analyticsApi.getAnalyticsSnapshots(songId),
  });

  if (snapshots.isLoading) {
    return <AnalyticsLoadingState />;
  }

  if (snapshots.isError) {
    return (
      <Panel title="Analytics unavailable" label="ANALYTICS / PERFORMANCE">
        <ErrorState
          detail="We couldn't load recorded performance snapshots from Artist OS."
          onRetry={() => snapshots.refetch()}
        />
      </Panel>
    );
  }

  const items = sortAnalyticsSnapshots(snapshots.data ?? []);
  const latestByPlatform = latestAnalyticsByPlatform(items);
  const platforms = recordedAnalyticsPlatforms(items);
  const filteredItems =
    platformFilter === "All"
      ? items
      : items.filter((snapshot) => snapshot.platform === platformFilter);

  return (
    <div className="space-y-4">
      <Panel title="ANALYTICS" label="ANALYTICS / PERFORMANCE">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Record platform performance at specific measurement dates and compare each platform
            against its previous stored snapshot.
          </p>
          <AnalyticsSnapshotFormDialog
            songId={songId}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Add Snapshot
              </Button>
            }
          />
        </div>
      </Panel>

      {!items.length ? (
        <Panel title="Latest performance" label="LATEST PERFORMANCE">
          <EmptyState
            title="NO PERFORMANCE SNAPSHOTS"
            detail="Start recording performance data for this song."
          />
          <div className="mt-4 flex justify-center">
            <AnalyticsSnapshotFormDialog
              songId={songId}
              trigger={
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                  Add Snapshot
                </Button>
              }
            />
          </div>
        </Panel>
      ) : (
        <>
          <Panel title="Latest performance" label="LATEST PERFORMANCE">
            <div className="grid gap-3 lg:grid-cols-2">
              {latestByPlatform.map((snapshot) => (
                <article key={snapshot.platform} className="border border-border bg-background p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase">
                        {analyticsPlatformLabel(snapshot.platform)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Latest recorded snapshot date: {formatDate(snapshot.snapshotDate)}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                    <AnalyticsMetric label="Views" value={formatMetricNumber(snapshot.views)} />
                    <AnalyticsMetric label="Likes" value={formatMetricNumber(snapshot.likes)} />
                    <AnalyticsMetric
                      label="Comments"
                      value={formatMetricNumber(snapshot.comments)}
                    />
                    <AnalyticsMetric
                      label="Watch time"
                      value={formatAnalyticsWatchTime(snapshot.watchTimeMinutes)}
                    />
                    <AnalyticsMetric
                      label="Subscribers gained"
                      value={formatMetricNumber(snapshot.subscribersGained)}
                    />
                  </dl>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Performance history" label="PERFORMANCE HISTORY">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Snapshots are ordered by measurement date. Changes compare only with the previous
                  snapshot from the same platform.
                </p>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Platform filter">
                <Button
                  variant={platformFilter === "All" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatformFilter("All")}
                >
                  All platforms
                </Button>
                {platforms.map((platform) => (
                  <Button
                    key={platform}
                    variant={platformFilter === platform ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlatformFilter(platform)}
                  >
                    {analyticsPlatformLabel(platform)}
                  </Button>
                ))}
              </div>
            </div>
            {filteredItems.length ? (
              <div className="space-y-3">
                {filteredItems.map((snapshot) => (
                  <AnalyticsSnapshotRow
                    key={snapshot.id}
                    songId={songId}
                    snapshot={snapshot}
                    previousSnapshot={previousSnapshotForPlatform(snapshot, items)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No snapshots for this platform"
                detail="Choose another platform filter or add a snapshot for this one."
              />
            )}
          </Panel>
        </>
      )}

      {items.length === 1 ? (
        <Panel title="Trend" label="CHANGE SINCE PREVIOUS SNAPSHOT">
          <EmptyState
            title="ONE SNAPSHOT RECORDED"
            detail="Record another snapshot for the same platform to compare movement over time."
          />
        </Panel>
      ) : null}
    </div>
  );
}
