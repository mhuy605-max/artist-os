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
  MiniBars,
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

const songsQueryKey = ["songs"];

function audioAssetsQueryKey(songId: string) {
  return ["songs", songId, "audio-assets"];
}

function visualAssetsQueryKey(songId: string) {
  return ["songs", songId, "visual-assets"];
}

function releaseQueryKey(songId: string) {
  return ["songs", songId, "release"];
}

function releaseChecklistQueryKey(songId: string) {
  return ["songs", songId, "release", "checklist"];
}

function contentItemsQueryKey(songId: string) {
  return ["songs", songId, "content-items"];
}

function creditsQueryKey(songId: string) {
  return ["songs", songId, "credits"];
}

function analyticsSnapshotsQueryKey(songId: string) {
  return ["songs", songId, "analytics"];
}

function calendarQueryKey(from: string, to: string) {
  return ["calendar", from, to];
}

const dashboardQueryKey = ["dashboard"];

function useSongs() {
  return useQuery({
    queryKey: songsQueryKey,
    queryFn: songsApi.getSongs,
  });
}

function normalizeId(id: Song["id"]) {
  return String(id);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthRange(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  return {
    start,
    end,
    from: toDateInputValue(start),
    to: toDateInputValue(end),
  };
}

function shiftMonth(month: Date, offset: number) {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

function monthTitle(month: Date) {
  return month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function calendarGridDays(month: Date) {
  const { start, end } = monthRange(month);
  const firstVisible = new Date(start);
  firstVisible.setDate(start.getDate() - start.getDay());
  const lastVisible = new Date(end);
  lastVisible.setDate(end.getDate() + (6 - end.getDay()));

  const days: Date[] = [];
  for (const day = new Date(firstVisible); day <= lastVisible; day.setDate(day.getDate() + 1)) {
    days.push(new Date(day));
  }

  return days;
}

function isSongStatus(value: string): value is SongStatus {
  return SONG_STATUSES.includes(value as SongStatus);
}

function statusLabel(status: string) {
  return isSongStatus(status) ? SONG_STATUS_LABELS[status] : status;
}

function validateSongPayload(payload: SongPayload) {
  const title = payload.title.trim();
  if (!title) return "Title is required.";
  if (title.length > 200) return "Title must be 200 characters or fewer.";
  if (!SONG_STATUSES.includes(payload.status)) return "Choose a valid status.";
  return "";
}

function useSongMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: songsQueryKey });

  return {
    create: useMutation({
      mutationFn: songsApi.createSong,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: SongPayload }) =>
        songsApi.updateSong(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: songsApi.deleteSong,
      onSuccess: invalidate,
    }),
  };
}

function FallbackNotice() {
  return isUsingFallbackData() ? (
    <div className="mb-4 border border-border-strong bg-panel p-3 text-sm text-muted-foreground">
      Catalog preview mode: the local workspace is unavailable, so changes stay in this browser
      session.
    </div>
  ) : null;
}

function SongFormDialog({
  mode,
  song,
  trigger,
}: {
  mode: "create" | "edit";
  song?: Song;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(song?.title ?? "");
  const [status, setStatus] = useState<SongStatus>(
    isSongStatus(song?.status ?? "") ? (song!.status as SongStatus) : "Demo",
  );
  const [error, setError] = useState("");
  const mutations = useSongMutations();
  const mutation = mode === "create" ? mutations.create : mutations.update;

  async function submit() {
    const payload = { title: title.trim(), status };
    const validationError = validateSongPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (mode === "create") {
        await mutations.create.mutateAsync(payload);
        setTitle("");
        setStatus("Demo");
      } else if (song) {
        await mutations.update.mutateAsync({ id: normalizeId(song.id), payload });
      }
      setError("");
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The song could not be saved.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === "create" ? "New song" : "Edit project"}
          </DialogTitle>
          <DialogDescription>
            Name the project and place it in the current lifecycle.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="label-tech" htmlFor={`${mode}-title`}>
              Project title
            </label>
            <Input
              id={`${mode}-title`}
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label className="label-tech">Lifecycle</label>
            <Select value={status} onValueChange={(value) => setStatus(value as SongStatus)}>
              <SelectTrigger className="mt-2" aria-label="Lifecycle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SONG_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {SONG_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? (
            <p className="border border-border bg-panel p-3 text-sm text-muted-foreground">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving" : mode === "create" ? "Create song" : "Save changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SongCard({ song }: { song: Song }) {
  return (
    <article className="group border border-border bg-panel transition-colors hover:border-border-strong">
      <Link
        to="/songs/$songId"
        params={{ songId: normalizeId(song.id) }}
        className="grid gap-4 p-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:grid-cols-[1fr_180px_150px]"
      >
        <div className="min-w-0">
          <p className="label-tech">Project</p>
          <h2 className="mt-2 break-words text-xl font-semibold leading-tight tracking-normal">
            {song.title}
          </h2>
          <p className="mt-3 text-xs uppercase text-muted-foreground">Open workspace</p>
        </div>
        <div>
          <p className="label-tech">Lifecycle</p>
          <div className="mt-2">
            <StatusBadge status={song.status} />
          </div>
        </div>
        <div>
          <p className="label-tech">Created</p>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            {formatDate(song.createdAt)}
          </p>
        </div>
      </Link>
    </article>
  );
}

export function DashboardPage() {
  const dashboard = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: dashboardApi.getDashboard,
  });
  const data = dashboard.data;

  return (
    <AppShell>
      {dashboard.isLoading ? (
        <DashboardLoadingState />
      ) : dashboard.isError ? (
        <ErrorState
          detail="Command Center could not refresh. Retry when the local workspace is reachable."
          onRetry={() => dashboard.refetch()}
        />
      ) : data ? (
        <div className="space-y-5">
          <DashboardCommandHeader />

          <section
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Catalog summary"
          >
            <DashboardMetric label="Total songs" value={data.summary.totalSongs} />
            <DashboardMetric label="Active songs" value={data.summary.activeSongs} />
            <DashboardMetric label="Upcoming releases" value={data.summary.upcomingReleases} />
            <DashboardMetric label="Scheduled content" value={data.summary.scheduledContent} />
          </section>

          <Panel title="Catalog state" label="Song lifecycle">
            <DashboardPipelineRail pipeline={data.pipeline} />
          </Panel>

          {data.summary.totalSongs === 0 ? <DashboardEmptyCommandCenter /> : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <Panel title="Next in motion" label="Upcoming">
              {data.upcoming.length ? (
                <div className="divide-y divide-border">
                  {data.upcoming.map((item) => (
                    <DashboardUpcomingRow key={dashboardUpcomingKey(item)} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming dates"
                  detail="Future Release dates and Content due or scheduled dates will appear here."
                />
              )}
            </Panel>

            <Panel title="Release readiness" label="Closest checks">
              {data.releaseReadiness.length ? (
                <div className="space-y-3">
                  {data.releaseReadiness.map((item) => (
                    <DashboardReadinessRow key={normalizeId(item.releaseId)} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No release plans"
                  detail="Create Release metadata to track checklist readiness."
                />
              )}
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel title="Stored snapshots" label="Analytics">
              {data.analyticsOverview.length ? (
                <div className="divide-y divide-border">
                  {data.analyticsOverview.map((item) => (
                    <DashboardAnalyticsRow
                      key={`${normalizeId(item.songId)}-${item.platform}`}
                      item={item}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No analytics snapshots"
                  detail="Manually recorded analytics snapshots will appear here once added."
                />
              )}
              <p className="mt-4 border-t border-border pt-3 text-xs uppercase tracking-normal text-muted-foreground">
                Stored manually. No platform sync active.
              </p>
            </Panel>

            <Panel title="Recent changes" label="Source timestamps">
              {data.recentActivity.length ? (
                <div className="divide-y divide-border">
                  {data.recentActivity.map((item) => (
                    <DashboardActivityRow
                      key={`${item.type}-${normalizeId(item.songId)}-${item.occurredAt}`}
                      item={item}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No recent activity"
                  detail="Created or updated source records will appear here."
                />
              )}
            </Panel>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Dashboard unavailable"
          detail="The backend returned no dashboard payload."
        />
      )}
    </AppShell>
  );
}

function DashboardCommandHeader() {
  return (
    <header className="border-b border-border pb-5">
      <p className="label-tech">Dashboard / Creative operations</p>
      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="display-xl uppercase">Command Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Current portfolio overview, ordered for the next operational decision.
          </p>
        </div>
        <p className="font-mono text-xs uppercase text-muted-foreground">
          Latest stored workspace data
        </p>
      </div>
    </header>
  );
}

function DashboardMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-background p-4">
      <p className="font-mono text-4xl font-semibold leading-none">{value}</p>
      <p className="mt-3 label-tech">{label}</p>
    </div>
  );
}

function DashboardPipelineRail({ pipeline }: { pipeline: DashboardPipelineItem[] }) {
  const maxCount = Math.max(...pipeline.map((item) => item.count), 1);

  return (
    <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-9">
      {pipeline.map((item, index) => {
        const opacity = item.count === 0 ? 0 : 0.3 + (item.count / maxCount) * 0.7;

        return (
          <div key={item.status} className="border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="font-mono text-2xl font-semibold leading-none">{item.count}</p>
            </div>
            <p className="mt-5 min-h-8 text-xs font-medium uppercase leading-tight">{item.label}</p>
            <div className="mt-3 h-1.5 bg-panel" aria-hidden="true">
              <div className="h-full bg-foreground" style={{ width: "100%", opacity }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DashboardUpcomingRow({ item }: { item: DashboardUpcomingItem }) {
  return (
    <Link
      to="/songs/$songId"
      params={{ songId: normalizeId(item.songId) }}
      className="grid gap-3 py-3 transition-colors hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:grid-cols-[86px_1fr]"
    >
      <div>
        <p className="font-mono text-xs uppercase text-muted-foreground">
          {formatMonthDay(item.date)}
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold leading-none">
          {formatDayNumber(item.date)}
        </p>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="label-tech">{dashboardUpcomingLabel(item)}</p>
          <StatusBadge status={item.status} />
        </div>
        <p className="mt-2 truncate text-sm font-medium uppercase">{item.title}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {item.songTitle}
          {item.platform ? ` / ${item.platform}` : ""}
        </p>
      </div>
    </Link>
  );
}

function DashboardReadinessRow({ item }: { item: DashboardReleaseReadiness }) {
  return (
    <Link
      to="/songs/$songId"
      params={{ songId: normalizeId(item.songId) }}
      className="block border border-border bg-background p-3 transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase">{item.songTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.releaseDate ? formatDate(item.releaseDate) : "No release date"}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 h-2 bg-panel">
        <div className="h-full bg-foreground" style={{ width: `${item.readinessPercentage}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {item.completedItems} / {item.totalItems} complete
        </span>
        <span>{item.readinessPercentage}%</span>
      </div>
    </Link>
  );
}

function DashboardAnalyticsRow({ item }: { item: DashboardAnalyticsItem }) {
  return (
    <Link
      to="/songs/$songId"
      params={{ songId: normalizeId(item.songId) }}
      className="block py-3 transition-colors hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase">{item.songTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {analyticsPlatformLabel(item.platform)} / {formatDate(item.snapshotDate)}
          </p>
        </div>
        <p className="font-mono text-sm">{formatNumber(item.views)} views</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
        <span>{formatNumber(item.likes)} likes</span>
        <span>{formatNumber(item.comments)} comments</span>
        <span>{formatWatchTime(item.watchTimeMinutes)}</span>
        <span>{formatNumber(item.subscribersGained)} subs</span>
      </div>
    </Link>
  );
}

function DashboardActivityRow({ item }: { item: DashboardActivityItem }) {
  return (
    <Link
      to="/songs/$songId"
      params={{ songId: normalizeId(item.songId) }}
      className="grid grid-cols-[18px_1fr] gap-3 py-3 transition-colors hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="pt-1.5">
        <span className="block h-2 w-2 bg-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{item.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.songTitle} / {formatDate(item.occurredAt)}
        </p>
      </div>
    </Link>
  );
}

function dashboardUpcomingKey(item: DashboardUpcomingItem) {
  return `${item.sourceType}-${normalizeId(item.sourceId)}-${item.eventType}-${item.date}`;
}

function dashboardUpcomingLabel(item: DashboardUpcomingItem) {
  if (item.eventType === "ReleaseDate") return "Release";
  if (item.eventType === "ContentDue") return "Content due";
  return "Scheduled content";
}

function DashboardEmptyCommandCenter() {
  return (
    <div className="border border-dashed border-border bg-panel p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase">No projects yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first Song to start building the workspace.
          </p>
        </div>
        <Button asChild>
          <Link to="/songs">
            <Plus className="h-4 w-4" />
            New song
          </Link>
        </Button>
      </div>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="space-y-5" aria-label="Loading dashboard">
      <DashboardCommandHeader />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse border border-border bg-panel" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="h-80 animate-pulse border border-border bg-panel" />
        <div className="h-80 animate-pulse border border-border bg-panel" />
      </div>
    </div>
  );
}

function formatMonthDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "DATE";
  return new Intl.DateTimeFormat("en", { month: "short" }).format(date).toUpperCase();
}

function formatDayNumber(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
}

function SongsPortfolioHeader() {
  return (
    <header className="mb-5 border-b border-border pb-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-tech">Songs / Catalog</p>
          <h1 className="mt-3 display-xl uppercase">Projects</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your active music workspace.</p>
        </div>
        <SongFormDialog
          mode="create"
          trigger={
            <Button className="w-full md:w-auto">
              <Plus className="h-4 w-4" />
              New song
            </Button>
          }
        />
      </div>
    </header>
  );
}

function SongsCatalogStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-background p-3">
      <p className="font-mono text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-2 label-tech">{label}</p>
    </div>
  );
}

function SongsLoadingState() {
  return (
    <div className="space-y-3" aria-label="Loading projects">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-32 animate-pulse border border-border bg-panel" />
      ))}
    </div>
  );
}

function SongsEmptyState() {
  return (
    <div className="border border-dashed border-border bg-panel p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase">No projects yet</p>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Create your first Song to begin building its audio, visual, release, content, credit,
            and analytics workspace.
          </p>
        </div>
        <SongFormDialog
          mode="create"
          trigger={
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New song
            </Button>
          }
        />
      </div>
    </div>
  );
}

export function SongsPage() {
  const songs = useSongs();
  const mutations = useSongMutations();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("created-desc");
  const allSongs = useMemo(() => songs.data ?? [], [songs.data]);
  const catalogStats = useMemo(
    () => ({
      total: allSongs.length,
      active: allSongs.filter((song) => song.status !== "Released").length,
      released: allSongs.filter((song) => song.status === "Released").length,
    }),
    [allSongs],
  );

  const filtered = useMemo(() => {
    return [...allSongs]
      .filter((song) => song.title.toLowerCase().includes(query.trim().toLowerCase()))
      .filter((song) => status === "all" || song.status === status)
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "status") return statusLabel(a.status).localeCompare(statusLabel(b.status));
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [allSongs, query, status, sort]);

  return (
    <AppShell>
      <SongsPortfolioHeader />
      <FallbackNotice />
      <section className="mb-4 grid gap-3 sm:grid-cols-3" aria-label="Catalog context">
        <SongsCatalogStat label="Total projects" value={catalogStats.total} />
        <SongsCatalogStat label="Active" value={catalogStats.active} />
        <SongsCatalogStat label="Released" value={catalogStats.released} />
      </section>
      <Panel className="mb-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_150px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects"
              aria-label="Search projects"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Filter by lifecycle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {SONG_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {SONG_STATUS_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger aria-label="Sort projects">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created-desc">Newest</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Panel>

      <div>
        {songs.isLoading ? (
          <SongsLoadingState />
        ) : songs.isError ? (
          <ErrorState
            title="Projects unavailable"
            detail="We couldn't load your catalog."
            onRetry={() => songs.refetch()}
          />
        ) : allSongs.length === 0 ? (
          <SongsEmptyState />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matching projects"
            detail="Clear search or choose another lifecycle."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((song) => (
              <div
                key={normalizeId(song.id)}
                className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto]"
              >
                <SongCard song={song} />
                <div className="flex gap-2 xl:flex-col">
                  <SongFormDialog
                    mode="edit"
                    song={song}
                    trigger={
                      <Button variant="outline" size="sm" className="min-w-24">
                        Edit
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="min-w-24">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete song</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the project and its workspace metadata from Artist OS.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => mutations.remove.mutate(normalizeId(song.id))}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function WorkspaceLoadingState() {
  return (
    <div className="space-y-5" aria-label="Loading project workspace">
      <div className="border-b border-border pb-5">
        <div className="h-4 w-28 animate-pulse bg-panel" />
        <div className="mt-5 h-3 w-36 animate-pulse bg-panel" />
        <div className="mt-3 h-12 max-w-3xl animate-pulse bg-panel" />
        <div className="mt-4 h-6 w-40 animate-pulse bg-panel" />
      </div>
      <div className="h-11 animate-pulse border border-border bg-panel" />
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="h-36 animate-pulse border border-border bg-panel" />
        <div className="h-36 animate-pulse border border-border bg-panel" />
      </div>
      <div className="h-40 animate-pulse border border-border bg-panel" />
    </div>
  );
}

function WorkspaceCriticalError({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border border-border-strong bg-panel p-5">
      <p className="label-tech">Songs / Project</p>
      <h1 className="mt-3 display-xl uppercase">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{detail}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
        <Button asChild>
          <Link to="/songs">Back to Projects</Link>
        </Button>
      </div>
    </div>
  );
}

export function SongWorkspacePage({ songId }: { songId: string }) {
  const songQuery = useQuery({
    queryKey: ["songs", songId],
    queryFn: () => songsApi.getSong(songId),
    retry: false,
  });
  const notFound = songQuery.error instanceof ApiError && songQuery.error.status === 404;

  return (
    <AppShell>
      {songQuery.isLoading ? (
        <WorkspaceLoadingState />
      ) : songQuery.isError ? (
        <WorkspaceCriticalError
          title={notFound ? "Project not found" : "Project unavailable"}
          detail={notFound ? "This project isn't available." : "We couldn't load this project."}
          onRetry={notFound ? undefined : () => songQuery.refetch()}
        />
      ) : songQuery.data ? (
        <Workspace song={songQuery.data} />
      ) : (
        <WorkspaceCriticalError title="Project not found" detail="This project isn't available." />
      )}
    </AppShell>
  );
}

function Workspace({ song }: { song: Song }) {
  const id = normalizeId(song.id);
  const tabs = ["overview", "audio", "visuals", "release", "content", "credits", "analytics"];
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <>
      <FallbackNotice />
      <header className="mb-5 border-b border-border pb-5">
        <Link
          to="/songs"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" />
          Projects
        </Link>
        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="label-tech">Songs / Project</p>
            <h1 className="mt-3 max-w-5xl break-words text-4xl font-semibold uppercase leading-[0.95] tracking-normal md:text-6xl">
              {song.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusBadge status={song.status} size="md" />
              <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Created {formatDate(song.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex h-auto w-full justify-start overflow-x-auto rounded-none border border-border bg-panel p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none px-4 py-2 text-xs uppercase tracking-[0.12em] data-[state=active]:border data-[state=active]:border-border-strong data-[state=active]:bg-background"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab song={song} onNavigateTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="audio">
          <AudioTab songId={id} />
        </TabsContent>
        <TabsContent value="visuals">
          <VisualsTab songId={id} />
        </TabsContent>
        <TabsContent value="release">
          <ReleaseTab songId={id} />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab songId={id} />
        </TabsContent>
        <TabsContent value="credits">
          <CreditsTab songId={id} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab songId={id} />
        </TabsContent>
      </Tabs>
    </>
  );
}

type WorkspaceTabValue = "audio" | "visuals" | "release" | "content" | "credits" | "analytics";

type AttentionItem = {
  title: string;
  detail: string;
  tab?: WorkspaceTabValue;
};

function OverviewTab({
  song,
  onNavigateTab,
}: {
  song: Song;
  onNavigateTab: (tab: string) => void;
}) {
  const id = normalizeId(song.id);
  const releaseRelevant = isReleaseRelevant(song.status);
  const audio = useQuery({
    queryKey: audioAssetsQueryKey(id),
    queryFn: () => audioAssetsApi.getAudioAssets(id),
  });
  const visuals = useQuery({
    queryKey: visualAssetsQueryKey(id),
    queryFn: () => visualAssetsApi.getVisualAssets(id),
  });
  const release = useQuery({
    queryKey: releaseQueryKey(id),
    queryFn: () => releasesApi.getRelease(id),
    enabled: releaseRelevant,
  });
  const checklist = useQuery({
    queryKey: releaseChecklistQueryKey(id),
    queryFn: () => releaseChecklistApi.getChecklist(id),
    enabled: releaseRelevant && release.data !== undefined && release.data !== null,
  });
  const content = useQuery({
    queryKey: contentItemsQueryKey(id),
    queryFn: () => contentItemsApi.getContentItems(id),
  });
  const credits = useQuery({
    queryKey: creditsQueryKey(id),
    queryFn: () => creditsApi.getCredits(id),
  });
  const analytics = useQuery({
    queryKey: analyticsSnapshotsQueryKey(id),
    queryFn: () => analyticsApi.getAnalyticsSnapshots(id),
  });
  const attention = getNextAttention({
    song,
    audioAssets: audio.data,
    visualAssets: visuals.data,
    release: releaseRelevant ? release.data : null,
    checklist: checklist.data,
    contentItems: content.data,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Project state" label="Now">
          <ProjectStateSummary
            song={song}
            release={releaseRelevant ? release.data : null}
            releaseError={release.isError}
          />
        </Panel>
        <Panel title="Next attention" label="Focus">
          <NextAttentionItem item={attention} onNavigateTab={onNavigateTab} />
        </Panel>
      </div>

      <Panel title="Workspace areas" label="Map">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <WorkspaceAreaLink
            tab="audio"
            title="Audio"
            value={summaryCount(audio.data?.length, "asset", "assets", audio.isError)}
            onNavigateTab={onNavigateTab}
          />
          <WorkspaceAreaLink
            tab="visuals"
            title="Visuals"
            value={summaryCount(visuals.data?.length, "asset", "assets", visuals.isError)}
            onNavigateTab={onNavigateTab}
          />
          <WorkspaceAreaLink
            tab="release"
            title="Release"
            value={releaseSummary(releaseRelevant ? release.data : null, release.isError)}
            onNavigateTab={onNavigateTab}
          />
          <WorkspaceAreaLink
            tab="content"
            title="Content"
            value={summaryCount(content.data?.length, "item", "items", content.isError)}
            onNavigateTab={onNavigateTab}
          />
          <WorkspaceAreaLink
            tab="credits"
            title="Credits"
            value={creditSummary(credits.data, credits.isError)}
            onNavigateTab={onNavigateTab}
          />
          <WorkspaceAreaLink
            tab="analytics"
            title="Analytics"
            value={summaryCount(analytics.data?.length, "snapshot", "snapshots", analytics.isError)}
            onNavigateTab={onNavigateTab}
          />
        </div>
      </Panel>

      {release.data && checklist.data?.length ? (
        <Panel title="Release readiness" label="Checklist">
          <ReleaseReadinessSummary items={checklist.data} />
        </Panel>
      ) : null}

      <DriveWorkspacePanel songId={id} />
    </div>
  );
}

function ProjectStateSummary({
  song,
  release,
  releaseError,
}: {
  song: Song;
  release?: Release | null;
  releaseError: boolean;
}) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
      <Info label="Lifecycle" value={statusLabel(song.status)} />
      <Info label="Created" value={formatDate(song.createdAt) ?? "-"} />
      <Info
        label="Release date"
        value={
          releaseError
            ? "Unavailable"
            : release?.releaseDate
              ? (formatDate(release.releaseDate) ?? "Scheduled")
              : "Not set up"
        }
      />
      <Info
        label="Release status"
        value={
          releaseError
            ? "Unavailable"
            : release
              ? (RELEASE_STATUS_LABELS[release.status] ?? release.status)
              : "Not set up"
        }
      />
    </dl>
  );
}

function NextAttentionItem({
  item,
  onNavigateTab,
}: {
  item: AttentionItem;
  onNavigateTab?: (tab: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-lg font-semibold uppercase leading-tight">{item.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
      </div>
      {item.tab && onNavigateTab ? (
        <Button variant="outline" size="sm" onClick={() => onNavigateTab(item.tab)}>
          Open {tabLabel(item.tab)}
        </Button>
      ) : null}
    </div>
  );
}

function WorkspaceAreaLink({
  tab,
  title,
  value,
  onNavigateTab,
}: {
  tab: WorkspaceTabValue;
  title: string;
  value: string;
  onNavigateTab: (tab: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigateTab(tab)}
      className="flex min-h-24 items-end justify-between gap-4 border border-border bg-background p-3 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      aria-label={`Open ${title} tab`}
    >
      <span>
        <span className="label-tech">{title}</span>
        <span className="mt-2 block text-sm text-muted-foreground">{value}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
    </button>
  );
}

function ReleaseReadinessSummary({ items }: { items: ReleaseChecklistItem[] }) {
  const completed = items.filter((item) => item.isCompleted).length;
  const total = items.length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className="font-mono text-3xl font-semibold leading-none"
            role="status"
            aria-label={`${completed} of ${total} release checklist items complete`}
          >
            {completed} / {total}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Checklist items complete</p>
        </div>
        <p className="font-mono text-sm text-muted-foreground">{percentage}%</p>
      </div>
      <div className="h-1 bg-background" aria-hidden>
        <div className="h-full bg-foreground" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function summaryCount(
  count: number | undefined,
  singular: string,
  plural: string,
  isError: boolean,
) {
  if (isError) return "Unavailable";
  if (count === undefined) return "Checking";
  if (count === 0) return `No ${plural}`;
  return `${count} ${count === 1 ? singular : plural}`;
}

function releaseSummary(release?: Release | null, isError?: boolean) {
  if (isError) return "Unavailable";
  if (release === undefined) return "Checking";
  if (!release) return "Not set up";
  return RELEASE_STATUS_LABELS[release.status] ?? release.status;
}

function creditSummary(credits?: Credit[], isError?: boolean) {
  if (isError) return "Unavailable";
  if (credits === undefined) return "Checking";
  const contributors = new Set(
    credits.map((credit) => credit.contributorName.trim()).filter(Boolean),
  );
  if (contributors.size === 0) return "No credits";
  return `${contributors.size} ${contributors.size === 1 ? "contributor" : "contributors"}`;
}

function isReleaseRelevant(status: string) {
  return ["Mastering", "ReleasePreparation", "ContentCampaign", "Released", "Analytics"].includes(
    status,
  );
}

function getNextAttention({
  song,
  audioAssets,
  visualAssets,
  release,
  checklist,
  contentItems,
}: {
  song: Song;
  audioAssets?: AudioAsset[];
  visualAssets?: VisualAsset[];
  release?: Release | null;
  checklist?: ReleaseChecklistItem[];
  contentItems?: ContentItem[];
}): AttentionItem {
  if (!audioAssets || !visualAssets || release === undefined || !contentItems) {
    return {
      title: "Checking project state",
      detail: "Overview is loading the current workspace areas.",
    };
  }

  if (audioAssets.length === 0) {
    return {
      title: "Add the first audio asset",
      detail: "Start the project workspace with a demo, recording, mix, or master.",
      tab: "audio",
    };
  }

  if (visualAssets.length === 0) {
    return {
      title: "Add visual assets",
      detail: "Attach cover, video, canvas, or campaign visual metadata for this project.",
      tab: "visuals",
    };
  }

  if (
    !release &&
    ["ReleasePreparation", "ContentCampaign", "Released", "Analytics"].includes(song.status)
  ) {
    return {
      title: "Set up release details",
      detail: "This lifecycle stage is ready for release metadata.",
      tab: "release",
    };
  }

  const nextChecklistItem = checklist
    ?.filter((item) => !item.isCompleted)
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
  if (release && nextChecklistItem) {
    return {
      title: nextChecklistItem.label,
      detail: "Next incomplete release checklist item.",
      tab: "release",
    };
  }

  const nextContent = nearestFutureContentItem(contentItems);
  if (nextContent) {
    return {
      title: nextContent.title,
      detail: `Upcoming content date: ${formatDate(nextContent.date)}`,
      tab: "content",
    };
  }

  return {
    title: "Review workspace areas",
    detail: "The main project records are in place. Open a workspace area to continue.",
  };
}

function nearestFutureContentItem(items: ContentItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return items
    .flatMap((item) =>
      [item.dueDate, item.scheduledAt]
        .filter((date): date is string => Boolean(date))
        .map((date) => ({ title: item.title, date })),
    )
    .filter((item) => {
      const date = new Date(item.date);
      return !Number.isNaN(date.getTime()) && date >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
}

function tabLabel(tab: string) {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

function DriveWorkspacePanel({ songId }: { songId: string }) {
  const queryClient = useQueryClient();
  const connection = useQuery({
    queryKey: googleDriveConnectionQueryKey,
    queryFn: googleDriveApi.getStatus,
  });
  const connected = connection.data?.connected === true;
  const needsReconnect = connection.data?.status === "ReauthRequired";
  const workspace = useQuery({
    queryKey: driveWorkspaceQueryKey(songId),
    queryFn: () => driveWorkspaceApi.getWorkspace(songId),
    retry: false,
    enabled: connected,
  });
  const provision = useMutation({
    mutationFn: () => driveWorkspaceApi.provisionWorkspace(songId),
    onSuccess: (data) => {
      queryClient.setQueryData(driveWorkspaceQueryKey(songId), data);
      queryClient.invalidateQueries({ queryKey: googleDriveConnectionQueryKey });
    },
  });
  const disconnected =
    !connected || isDriveWorkspaceDisconnectedError(workspace.error) || needsReconnect;
  const provisioned = connected && workspace.data?.isProvisioned === true;

  return (
    <Panel title="Project storage" label="Storage">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase">
            {provisioned
              ? "Ready"
              : needsReconnect
                ? "Reconnect required"
                : connected
                  ? "Storage connected"
                  : "Not connected"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {provisioned
              ? "Project folders are ready for media organization."
              : connected
                ? "This project does not have its folders yet."
                : "Connect storage from Settings when you want project files organized in Drive."}
          </p>
        </div>
        <FolderTree className="h-5 w-5 text-muted-foreground" />
      </div>

      {workspace.isLoading || connection.isLoading ? (
        <div
          className="mt-4 h-16 animate-pulse border border-border bg-background"
          aria-label="Checking project storage"
        />
      ) : provisioned && workspace.data ? (
        <DriveWorkspaceTree workspace={workspace.data} />
      ) : disconnected ? (
        <div className="mt-4 flex flex-col gap-3 border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {needsReconnect
              ? "Reconnect Google Drive in Settings before setting up project storage."
              : "Google Drive is not connected."}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/settings">Open Settings</Link>
          </Button>
        </div>
      ) : workspace.isError ? (
        <div className="mt-4 flex flex-col gap-3 border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Project storage could not be checked.</p>
          <Button variant="outline" size="sm" onClick={() => workspace.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="mt-4 border border-border bg-background p-3">
          <p className="text-sm font-medium uppercase">Storage is connected</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This project does not have its Drive folders yet.
          </p>
        </div>
      )}

      {connected && !workspace.isLoading && !workspace.isError ? (
        <div className="mt-4">
          <Button
            onClick={() => provision.mutate()}
            disabled={provision.isPending || workspace.data?.isProvisioned === true}
          >
            {provision.isPending
              ? "Setting up"
              : workspace.data?.isProvisioned
                ? "Storage ready"
                : "Set up project storage"}
          </Button>
        </div>
      ) : null}

      {provision.isError ? (
        <p className="mt-3 text-xs uppercase text-destructive">
          Project storage could not be set up.
        </p>
      ) : null}
    </Panel>
  );
}

function DriveWorkspaceTree({ workspace }: { workspace: DriveWorkspace }) {
  const songFolderName = workspace.songFolder?.name ?? "Song";
  const folders = [
    workspace.folders.audio?.name ?? "Audio",
    workspace.folders.visuals?.name ?? "Visuals",
    workspace.folders.release?.name ?? "Release",
    workspace.folders.content?.name ?? "Content",
  ];

  return (
    <div className="mt-4 border border-border bg-background p-3 font-mono text-xs">
      <p>DARKROOM SYSTEM</p>
      <p className="mt-1 pl-3">Songs</p>
      <p className="mt-1 pl-6">{songFolderName}</p>
      <div className="mt-1 space-y-1 pl-9 text-muted-foreground">
        {folders.map((folder) => (
          <p key={folder}>{folder}</p>
        ))}
      </div>
    </div>
  );
}

function useAudioAssetMutations(songId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: audioAssetsQueryKey(songId) });

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
      return "File already linked. Replacing files is not available yet.";
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

function groupedAudioAssets(assets: AudioAsset[]) {
  return AUDIO_ASSET_TYPES.map((type) => ({
    type,
    assets: assets.filter((asset) => asset.type === type),
  })).filter((group) => group.assets.length > 0);
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
  const [version, setVersion] = useState(String(asset?.version ?? 1));
  const [status, setStatus] = useState<AudioAssetStatus>(asset?.status ?? "Draft");
  const [durationSeconds, setDurationSeconds] = useState(
    asset?.durationSeconds == null ? "" : String(asset.durationSeconds),
  );
  const [fileSizeMb, setFileSizeMb] = useState(
    asset?.fileSizeBytes == null ? "" : (asset.fileSizeBytes / 1024 / 1024).toFixed(1),
  );
  const [isCurrent, setIsCurrent] = useState(asset?.isCurrent ?? false);
  const [error, setError] = useState("");
  const mutations = useAudioAssetMutations(songId);
  const mutation = mode === "create" ? mutations.create : mutations.update;

  async function submit() {
    const fileSizeMbValue = numberOrNull(fileSizeMb);
    const payload: AudioAssetPayload = {
      type,
      fileName: fileName.trim(),
      version: Number(version),
      status,
      durationSeconds: numberOrNull(durationSeconds),
      fileSizeBytes: fileSizeMbValue == null ? null : Math.round(fileSizeMbValue * 1024 * 1024),
      isCurrent,
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
        setVersion("1");
        setStatus("Draft");
        setDurationSeconds("");
        setFileSizeMb("");
        setIsCurrent(false);
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
            <label className="label-tech" htmlFor={`${mode}-audio-version-${asset?.id ?? "new"}`}>
              Version
            </label>
            <Input
              id={`${mode}-audio-version-${asset?.id ?? "new"}`}
              type="number"
              min={1}
              step={1}
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="mt-2"
            />
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
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={isCurrent}
              onCheckedChange={(checked) => setIsCurrent(checked === true)}
            />
            Current version
          </label>
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

function AudioFileAssociationPanel({
  asset,
  driveStatus,
  driveStatusError,
  upload,
}: {
  asset: AudioAsset;
  driveStatus?: GoogleDriveConnectionStatus;
  driveStatusError: boolean;
  upload: {
    isPending: boolean;
    error: unknown;
    mutate: (input: { audioAssetId: string; file: File }) => void;
  };
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
        </div>
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
}: {
  songId: string;
  asset: AudioAsset;
  driveStatus?: GoogleDriveConnectionStatus;
  driveStatusError: boolean;
}) {
  const mutations = useAudioAssetMutations(songId);
  const removeCopy = asset.linkedFile
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
          <p className="mt-3 break-words text-base font-semibold">{asset.fileName}</p>
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
          asset={asset}
          driveStatus={driveStatus}
          driveStatusError={driveStatusError}
          upload={mutations.upload}
        />
      </div>
    </article>
  );
}

function AudioTab({ songId }: { songId: string }) {
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
              label={`${group.assets.length} ${group.assets.length === 1 ? "ASSET" : "ASSETS"}`}
            >
              <div className="space-y-3">
                {group.assets.map((asset) => (
                  <AudioAssetRow
                    key={asset.id}
                    songId={songId}
                    asset={asset}
                    driveStatus={driveConnection.data}
                    driveStatusError={driveConnection.isError}
                  />
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function useVisualAssetMutations(songId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: visualAssetsQueryKey(songId) });

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
      return "File already linked. Replacing files is not available yet.";
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

function groupedVisualAssets(assets: VisualAsset[]) {
  return VISUAL_ASSET_TYPES.map((type) => ({
    type,
    assets: assets.filter((asset) => asset.type === type),
  })).filter((group) => group.assets.length > 0);
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
  const [version, setVersion] = useState(String(asset?.version ?? 1));
  const [status, setStatus] = useState<VisualAssetStatus>(asset?.status ?? "Draft");
  const [width, setWidth] = useState(asset?.width == null ? "" : String(asset.width));
  const [height, setHeight] = useState(asset?.height == null ? "" : String(asset.height));
  const [fileSizeMb, setFileSizeMb] = useState(
    asset?.fileSizeBytes == null ? "" : (asset.fileSizeBytes / 1024 / 1024).toFixed(1),
  );
  const [isCurrent, setIsCurrent] = useState(asset?.isCurrent ?? false);
  const [error, setError] = useState("");
  const mutations = useVisualAssetMutations(songId);
  const mutation = mode === "create" ? mutations.create : mutations.update;

  async function submit() {
    const fileSizeMbValue = numberOrNull(fileSizeMb);
    const payload: VisualAssetPayload = {
      type,
      fileName: fileName.trim(),
      version: Number(version),
      status,
      width: numberOrNull(width),
      height: numberOrNull(height),
      fileSizeBytes: fileSizeMbValue == null ? null : Math.round(fileSizeMbValue * 1024 * 1024),
      isCurrent,
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
        setVersion("1");
        setStatus("Draft");
        setWidth("");
        setHeight("");
        setFileSizeMb("");
        setIsCurrent(false);
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
            <label className="label-tech" htmlFor={`${mode}-visual-version-${asset?.id ?? "new"}`}>
              Version
            </label>
            <Input
              id={`${mode}-visual-version-${asset?.id ?? "new"}`}
              type="number"
              min={1}
              step={1}
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="mt-2"
            />
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
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={isCurrent}
              onCheckedChange={(checked) => setIsCurrent(checked === true)}
            />
            Current version
          </label>
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

function VisualFileAssociationPanel({
  asset,
  driveStatus,
  driveStatusError,
  upload,
}: {
  asset: VisualAsset;
  driveStatus?: GoogleDriveConnectionStatus;
  driveStatusError: boolean;
  upload: {
    isPending: boolean;
    error: unknown;
    mutate: (input: { visualAssetId: string; file: File }) => void;
  };
}) {
  const fileInputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const linkedFile = asset.linkedFile;

  if (linkedFile) {
    return (
      <div className="border border-border bg-panel p-3">
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
        </div>
      </div>
    );
  }

  if (driveStatus?.connected === false) {
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

  if (driveStatus?.status === "ReauthRequired") {
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
}: {
  songId: string;
  asset: VisualAsset;
  driveStatus?: GoogleDriveConnectionStatus;
  driveStatusError: boolean;
}) {
  const mutations = useVisualAssetMutations(songId);
  const removeCopy = asset.linkedFile
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
          <p className="mt-3 break-words text-base font-semibold">{asset.fileName}</p>
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
        </div>
        <VisualFileAssociationPanel
          asset={asset}
          driveStatus={driveStatus}
          driveStatusError={driveStatusError}
          upload={mutations.upload}
        />
      </div>
    </article>
  );
}

function VisualsTab({ songId }: { songId: string }) {
  const visualAssets = useQuery({
    queryKey: visualAssetsQueryKey(songId),
    queryFn: () => visualAssetsApi.getVisualAssets(songId),
  });
  const driveConnection = useQuery({
    queryKey: googleDriveConnectionQueryKey,
    queryFn: googleDriveApi.getStatus,
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
          <VisualAssetFormDialog
            songId={songId}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Add Visual Asset
              </Button>
            }
          />
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
            <VisualAssetFormDialog
              songId={songId}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  Add Visual Asset
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
              title={visualTypeLabel(group.type)}
              label={`${group.assets.length} ${group.assets.length === 1 ? "ASSET" : "ASSETS"}`}
            >
              <div className="space-y-3">
                {group.assets.map((asset) => (
                  <VisualAssetRow
                    key={asset.id}
                    songId={songId}
                    asset={asset}
                    driveStatus={driveConnection.data}
                    driveStatusError={driveConnection.isError}
                  />
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

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

function ReleaseTab({ songId }: { songId: string }) {
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

function useContentItemMutations(songId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: contentItemsQueryKey(songId) });

  return {
    create: useMutation({
      mutationFn: (payload: ContentItemPayload) =>
        contentItemsApi.createContentItem(songId, payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        contentItemId,
        payload,
      }: {
        contentItemId: string;
        payload: ContentItemPayload;
      }) => contentItemsApi.updateContentItem(songId, contentItemId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (contentItemId: string) =>
        contentItemsApi.deleteContentItem(songId, contentItemId),
      onSuccess: invalidate,
    }),
  };
}

function isContentType(value: string): value is ContentType {
  return CONTENT_TYPES.includes(value as ContentType);
}

function isContentStatus(value: string): value is ContentStatus {
  return CONTENT_STATUSES.includes(value as ContentStatus);
}

function isContentPlatform(value: string): value is ContentPlatform {
  return CONTENT_PLATFORMS.includes(value as ContentPlatform);
}

function contentTypeLabel(type: ContentType) {
  return CONTENT_TYPE_LABELS[type];
}

function contentStatusLabel(status: ContentStatus) {
  return CONTENT_STATUS_LABELS[status];
}

function contentPlatformLabel(platform?: ContentPlatform | null) {
  return platform ? CONTENT_PLATFORM_LABELS[platform] : "No platform";
}

function optionalContentValue(value?: string | null) {
  return value?.trim() || "Not set";
}

function isFinishedContent(item: ContentItem) {
  return item.status === "Published" || Boolean(item.publishedAt);
}

function parseDateOnly(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function daysFromToday(value?: string | null) {
  const date = parseDateOnly(value);
  if (!date) return null;
  const difference = date.getTime() - startOfToday().getTime();
  return Math.round(difference / 86_400_000);
}

function contentDateLabel(
  label: "Due" | "Scheduled" | "Published",
  value?: string | null,
  item?: ContentItem,
) {
  if (!value) return "Not set";
  const formatted = formatDate(value);
  const days = daysFromToday(value);

  if (label === "Published") return `Published ${formatted}`;
  if (item && isFinishedContent(item)) return formatted;
  if (days === null) return formatted;
  if (label === "Due") {
    if (days < 0) return `Overdue / ${formatted}`;
    if (days === 0) return `Due today / ${formatted}`;
    if (days <= 7) return `Due soon / ${formatted}`;
  }
  if (label === "Scheduled") {
    if (days === 0) return `Scheduled today / ${formatted}`;
    if (days > 0) return `Scheduled / ${formatted}`;
  }

  return formatted;
}

function contentSummary(items: ContentItem[]) {
  return {
    total: items.length,
    inProduction: items.filter((item) => ["InProduction", "Editing", "Ready"].includes(item.status))
      .length,
    scheduled: items.filter((item) => item.status === "Scheduled" || Boolean(item.scheduledAt))
      .length,
    published: items.filter((item) => isFinishedContent(item)).length,
  };
}

function contentStageCounts(items: ContentItem[]) {
  return CONTENT_STATUSES.map((status) => ({
    status,
    label: contentStatusLabel(status),
    count: items.filter((item) => item.status === status).length,
  }));
}

function contentPriorityRank(item: ContentItem) {
  if (isFinishedContent(item)) return 60;

  const dueDays = daysFromToday(item.dueDate);
  if (dueDays !== null && dueDays < 0) return 0;
  if (dueDays !== null && dueDays <= 7) return 10;

  const scheduledDays = daysFromToday(item.scheduledAt);
  if (scheduledDays !== null && scheduledDays >= 0) return 20;

  if (["InProduction", "Editing", "Ready"].includes(item.status)) return 30;
  if (["Idea", "Planned", "Scheduled"].includes(item.status)) return 40;

  return 50;
}

function sortContentItemsForBoard(items: ContentItem[]) {
  return [...items].sort((a, b) => {
    const rankDifference = contentPriorityRank(a) - contentPriorityRank(b);
    if (rankDifference !== 0) return rankDifference;

    const aDate = a.dueDate ?? a.scheduledAt ?? a.publishedAt ?? "";
    const bDate = b.dueDate ?? b.scheduledAt ?? b.publishedAt ?? "";
    if (aDate !== bDate) return aDate.localeCompare(bDate);

    return String(a.id).localeCompare(String(b.id));
  });
}

function validateContentItemPayload(payload: ContentItemPayload) {
  const title = payload.title.trim();
  if (!title) return "Title is required.";
  if (title.length > 200) return "Title must be 200 characters or fewer.";
  if (!isContentType(payload.type)) return "Choose a valid content type.";
  if (!isContentStatus(payload.status)) return "Choose a valid status.";
  if (payload.platform && !isContentPlatform(payload.platform)) return "Choose a valid platform.";
  if (payload.ownerName && payload.ownerName.trim().length > 120) {
    return "Owner must be 120 characters or fewer.";
  }
  if (payload.notes && payload.notes.trim().length > 1000) {
    return "Notes must be 1000 characters or fewer.";
  }
  return "";
}

function ContentItemFormDialog({
  songId,
  item,
  trigger,
}: {
  songId: string;
  item?: ContentItem;
  trigger: ReactNode;
}) {
  const mode = item ? "edit" : "create";
  const mutations = useContentItemMutations(songId);
  const mutation = mode === "create" ? mutations.create : mutations.update;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item?.title ?? "");
  const [type, setType] = useState<ContentType>(item?.type ?? "Teaser");
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "Idea");
  const [platform, setPlatform] = useState<ContentPlatform | "None">(item?.platform ?? "None");
  const [ownerName, setOwnerName] = useState(item?.ownerName ?? "");
  const [dueDate, setDueDate] = useState(item?.dueDate ?? "");
  const [scheduledAt, setScheduledAt] = useState(item?.scheduledAt ?? "");
  const [publishedAt, setPublishedAt] = useState(item?.publishedAt ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState("");

  async function submit() {
    const payload: ContentItemPayload = {
      title: title.trim(),
      type,
      status,
      platform: platform === "None" ? null : platform,
      ownerName: ownerName.trim() || null,
      dueDate: dueDate || null,
      scheduledAt: scheduledAt || null,
      publishedAt: publishedAt || null,
      notes: notes.trim() || null,
    };
    const validationError = validateContentItemPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (mode === "create") {
        await mutations.create.mutateAsync(payload);
        setTitle("");
        setType("Teaser");
        setStatus("Idea");
        setPlatform("None");
        setOwnerName("");
        setDueDate("");
        setScheduledAt("");
        setPublishedAt("");
        setNotes("");
      } else if (item) {
        await mutations.update.mutateAsync({
          contentItemId: String(item.id),
          payload,
        });
      }
      setError("");
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The content item could not be saved.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === "create" ? "Add content item" : "Edit content item"}
          </DialogTitle>
          <DialogDescription>
            Plan a piece of content for this Song. Scheduled and Published dates are Artist OS
            metadata only.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label-tech" htmlFor={`${mode}-content-title-${item?.id ?? "new"}`}>
              Title
            </label>
            <Input
              id={`${mode}-content-title-${item?.id ?? "new"}`}
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2"
              placeholder="Teaser 01"
            />
          </div>
          <div>
            <label className="label-tech">Type</label>
            <Select value={type} onValueChange={(value) => setType(value as ContentType)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {contentTypeLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as ContentStatus)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {contentStatusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech">Platform</label>
            <Select
              value={platform}
              onValueChange={(value) => setPlatform(value as ContentPlatform | "None")}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">No platform</SelectItem>
                {CONTENT_PLATFORMS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {contentPlatformLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-content-owner-${item?.id ?? "new"}`}>
              Owner
            </label>
            <Input
              id={`${mode}-content-owner-${item?.id ?? "new"}`}
              value={ownerName}
              maxLength={120}
              onChange={(event) => setOwnerName(event.target.value)}
              className="mt-2"
              placeholder="AR"
            />
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-content-due-${item?.id ?? "new"}`}>
              Due date
            </label>
            <Input
              id={`${mode}-content-due-${item?.id ?? "new"}`}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label
              className="label-tech"
              htmlFor={`${mode}-content-scheduled-${item?.id ?? "new"}`}
            >
              Scheduled date
            </label>
            <Input
              id={`${mode}-content-scheduled-${item?.id ?? "new"}`}
              type="date"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label
              className="label-tech"
              htmlFor={`${mode}-content-published-${item?.id ?? "new"}`}
            >
              Published date
            </label>
            <Input
              id={`${mode}-content-published-${item?.id ?? "new"}`}
              type="date"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
              className="mt-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label-tech" htmlFor={`${mode}-content-notes-${item?.id ?? "new"}`}>
              Notes
            </label>
            <Textarea
              id={`${mode}-content-notes-${item?.id ?? "new"}`}
              value={notes}
              maxLength={1000}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-2"
              placeholder="Creative direction, caption draft, shot notes, or handoff details."
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

function ContentItemRow({ songId, item }: { songId: string; item: ContentItem }) {
  const mutations = useContentItemMutations(songId);
  const notesPreview =
    item.notes && item.notes.length > 180 ? `${item.notes.slice(0, 177)}...` : item.notes;

  return (
    <article className="border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">{item.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="border border-border px-2 py-1">{contentTypeLabel(item.type)}</span>
            <span className="border border-border px-2 py-1">
              {contentPlatformLabel(item.platform)}
            </span>
            <span className="border border-border px-2 py-1">
              Owner: {optionalContentValue(item.ownerName)}
            </span>
          </div>
        </div>
        <StatusBadge status={contentStatusLabel(item.status)} />
      </div>
      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
        <div className="border border-border bg-panel p-3">
          <dt className="label-tech">Due</dt>
          <dd className="mt-1 text-foreground">{contentDateLabel("Due", item.dueDate, item)}</dd>
        </div>
        <div className="border border-border bg-panel p-3">
          <dt className="label-tech">Scheduled</dt>
          <dd className="mt-1 text-foreground">
            {contentDateLabel("Scheduled", item.scheduledAt, item)}
          </dd>
        </div>
        <div className="border border-border bg-panel p-3">
          <dt className="label-tech">Published</dt>
          <dd className="mt-1 text-foreground">
            {contentDateLabel("Published", item.publishedAt, item)}
          </dd>
        </div>
      </dl>
      {notesPreview ? (
        <p className="mt-3 break-words border-l border-border pl-3 text-xs text-muted-foreground">
          {notesPreview}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Updated {formatDate(item.updatedAt)}</p>
        <div className="flex gap-2">
          <ContentItemFormDialog
            songId={songId}
            item={item}
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
                <AlertDialogTitle>Remove content item?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes this ContentItem's planning metadata from DARKROOM SYSTEM. External
                  social posts are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => mutations.remove.mutate(String(item.id))}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </article>
  );
}

function ContentLoadingState() {
  return (
    <div className="space-y-4" aria-label="Loading content production">
      <Panel title="CONTENT" label="CONTENT / PRODUCTION">
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse bg-panel-strong" />
          <div className="h-4 w-1/3 animate-pulse bg-panel-strong" />
        </div>
      </Panel>
      <Panel title="Summary" label="SUMMARY">
        <div className="grid gap-2 sm:grid-cols-4">
          {["total", "production", "scheduled", "published"].map((item) => (
            <div key={item} className="border border-border bg-background p-4">
              <div className="h-7 w-10 animate-pulse bg-panel-strong" />
              <div className="mt-4 h-3 w-20 animate-pulse bg-panel-strong" />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Content items" label="CONTENT ITEMS">
        <div className="grid gap-3">
          {[0, 1].map((item) => (
            <div key={item} className="border border-border bg-background p-4">
              <div className="h-4 w-3/4 animate-pulse bg-panel-strong" />
              <div className="mt-3 h-3 w-1/2 animate-pulse bg-panel-strong" />
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[0, 1, 2].map((date) => (
                  <div key={date} className="h-12 animate-pulse border border-border bg-panel" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ContentTab({ songId }: { songId: string }) {
  const contentItems = useQuery({
    queryKey: contentItemsQueryKey(songId),
    queryFn: () => contentItemsApi.getContentItems(songId),
  });

  if (contentItems.isLoading) {
    return <ContentLoadingState />;
  }

  if (contentItems.isError) {
    return (
      <Panel title="Content unavailable" label="CONTENT / PRODUCTION">
        <ErrorState
          detail="We couldn't load content production from Artist OS."
          onRetry={() => contentItems.refetch()}
        />
      </Panel>
    );
  }

  const items = contentItems.data ?? [];
  const summary = contentSummary(items);
  const sortedItems = sortContentItemsForBoard(items);
  const pipeline = contentStageCounts(items);

  return (
    <div className="space-y-4">
      <Panel title="CONTENT" label="CONTENT / PRODUCTION">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Plan teasers, clips, visuals, and campaign posts for this Song.
          </p>
          <ContentItemFormDialog
            songId={songId}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Add Content
              </Button>
            }
          />
        </div>
      </Panel>

      <Panel title="Summary" label="SUMMARY">
        <div className="grid gap-2 sm:grid-cols-4">
          <MetricBlock label="TOTAL" value={String(summary.total)} />
          <MetricBlock label="IN PRODUCTION" value={String(summary.inProduction)} />
          <MetricBlock label="SCHEDULED" value={String(summary.scheduled)} />
          <MetricBlock label="PUBLISHED" value={String(summary.published)} />
        </div>
      </Panel>

      <Panel title="Content pipeline" label="CONTENT PIPELINE">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {pipeline.map((stage) => (
            <div key={stage.status} className="border border-border bg-background p-3">
              <p className="text-xs font-medium uppercase">{stage.label}</p>
              <p className="mt-3 font-mono text-2xl">{stage.count}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Content items" label="CONTENT ITEMS">
        <ContentItemFormDialog
          songId={songId}
          trigger={
            <Button variant="outline" size="sm" className="mb-4">
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          }
        />
        {sortedItems.length ? (
          <div className="grid gap-3">
            {sortedItems.map((item) => (
              <ContentItemRow key={item.id} songId={songId} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="NO CONTENT PLANNED"
            detail="Plan teasers, clips, videos, and campaign content for this Song."
          />
        )}
      </Panel>
    </div>
  );
}

function useCreditMutations(songId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: creditsQueryKey(songId) });

  return {
    create: useMutation({
      mutationFn: (payload: CreditPayload) => creditsApi.createCredit(songId, payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ creditId, payload }: { creditId: string; payload: CreditPayload }) =>
        creditsApi.updateCredit(songId, creditId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (creditId: string) => creditsApi.deleteCredit(songId, creditId),
      onSuccess: invalidate,
    }),
  };
}

function isCreditRole(value: string): value is CreditRole {
  return CREDIT_ROLES.includes(value as CreditRole);
}

function isCreditStatus(value: string): value is CreditStatus {
  return CREDIT_STATUSES.includes(value as CreditStatus);
}

function creditRoleLabel(role: CreditRole) {
  return CREDIT_ROLE_LABELS[role];
}

function validateCreditPayload(payload: CreditPayload) {
  const contributorName = payload.contributorName.trim();
  if (!contributorName) return "Contributor name is required.";
  if (contributorName.length > 160) return "Contributor name must be 160 characters or fewer.";
  if (!isCreditRole(payload.role)) return "Choose a valid role.";
  if (!isCreditStatus(payload.status)) return "Choose a valid status.";
  if (payload.contact && payload.contact.trim().length > 160) {
    return "Contact must be 160 characters or fewer.";
  }
  if (
    payload.splitPercentage != null &&
    (payload.splitPercentage < 0 || payload.splitPercentage > 100)
  ) {
    return "Planned split must be between 0 and 100.";
  }
  if (payload.notes && payload.notes.trim().length > 1000) {
    return "Notes must be 1000 characters or fewer.";
  }
  return "";
}

function CreditFormDialog({
  songId,
  credit,
  trigger,
}: {
  songId: string;
  credit?: Credit;
  trigger: ReactNode;
}) {
  const mode = credit ? "edit" : "create";
  const mutations = useCreditMutations(songId);
  const mutation = mode === "create" ? mutations.create : mutations.update;
  const [open, setOpen] = useState(false);
  const [contributorName, setContributorName] = useState(credit?.contributorName ?? "");
  const [role, setRole] = useState<CreditRole>(credit?.role ?? "Artist");
  const [contact, setContact] = useState(credit?.contact ?? "");
  const [status, setStatus] = useState<CreditStatus>(credit?.status ?? "Pending");
  const [splitPercentage, setSplitPercentage] = useState(
    credit?.splitPercentage == null ? "" : String(credit.splitPercentage),
  );
  const [notes, setNotes] = useState(credit?.notes ?? "");
  const [error, setError] = useState("");

  async function submit() {
    const plannedSplit = numberOrNull(splitPercentage);
    const payload: CreditPayload = {
      contributorName: contributorName.trim(),
      role,
      contact: contact.trim() || null,
      status,
      splitPercentage: plannedSplit,
      notes: notes.trim() || null,
    };
    const validationError = validateCreditPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (mode === "create") {
        await mutations.create.mutateAsync(payload);
        setContributorName("");
        setRole("Artist");
        setContact("");
        setStatus("Pending");
        setSplitPercentage("");
        setNotes("");
      } else if (credit) {
        await mutations.update.mutateAsync({
          creditId: String(credit.id),
          payload,
        });
      }
      setError("");
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The credit could not be saved.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === "create" ? "Add credit" : "Edit credit"}
          </DialogTitle>
          <DialogDescription>
            This tracks contributor metadata only. Planned split is not payment, royalty, or legal
            agreement handling.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-tech" htmlFor={`${mode}-credit-name-${credit?.id ?? "new"}`}>
              Contributor
            </label>
            <Input
              id={`${mode}-credit-name-${credit?.id ?? "new"}`}
              value={contributorName}
              maxLength={160}
              onChange={(event) => setContributorName(event.target.value)}
              className="mt-2"
              placeholder="Kira Mott"
            />
          </div>
          <div>
            <label className="label-tech">Role</label>
            <Select value={role} onValueChange={(value) => setRole(value as CreditRole)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CREDIT_ROLES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {creditRoleLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-credit-contact-${credit?.id ?? "new"}`}>
              Contact
            </label>
            <Input
              id={`${mode}-credit-contact-${credit?.id ?? "new"}`}
              value={contact}
              maxLength={160}
              onChange={(event) => setContact(event.target.value)}
              className="mt-2"
              placeholder="kira@darkroom.system"
            />
          </div>
          <div>
            <label className="label-tech">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as CreditStatus)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CREDIT_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-credit-split-${credit?.id ?? "new"}`}>
              Planned Split %
            </label>
            <Input
              id={`${mode}-credit-split-${credit?.id ?? "new"}`}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={splitPercentage}
              onChange={(event) => setSplitPercentage(event.target.value)}
              className="mt-2"
              placeholder="25"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label-tech" htmlFor={`${mode}-credit-notes-${credit?.id ?? "new"}`}>
              Notes
            </label>
            <Textarea
              id={`${mode}-credit-notes-${credit?.id ?? "new"}`}
              value={notes}
              maxLength={1000}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-2"
              placeholder="Contributor notes or pending confirmation details."
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

function CreditRow({ songId, credit }: { songId: string; credit: Credit }) {
  const mutations = useCreditMutations(songId);

  return (
    <div className="border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{credit.contributorName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {creditRoleLabel(credit.role)} / {credit.contact ?? "No contact"}
          </p>
        </div>
        <StatusBadge status={credit.status} />
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          <dt className="label-tech">Planned Split</dt>
          <dd>
            {credit.splitPercentage == null ? "Not set" : `${credit.splitPercentage}% metadata`}
          </dd>
        </div>
        <div>
          <dt className="label-tech">Created</dt>
          <dd>{formatDate(credit.createdAt)}</dd>
        </div>
        <div>
          <dt className="label-tech">Updated</dt>
          <dd>{formatDate(credit.updatedAt)}</dd>
        </div>
      </dl>
      {credit.notes ? <p className="mt-3 text-xs text-muted-foreground">{credit.notes}</p> : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Contributor metadata only / no payment or legal workflow
        </p>
        <div className="flex gap-2">
          <CreditFormDialog
            songId={songId}
            credit={credit}
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
                <AlertDialogTitle>Delete credit metadata</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes only the credit record. No legal agreement, payment, royalty, or team
                  account is affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => mutations.remove.mutate(String(credit.id))}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function CreditsTab({ songId }: { songId: string }) {
  const credits = useQuery({
    queryKey: creditsQueryKey(songId),
    queryFn: () => creditsApi.getCredits(songId),
  });

  if (credits.isLoading) {
    return <LoadingState label="Loading credit metadata" />;
  }

  if (credits.isError) {
    return (
      <ErrorState
        detail="Credit metadata could not be loaded from the backend."
        onRetry={() => credits.refetch()}
      />
    );
  }

  const items = credits.data ?? [];

  return (
    <Panel title="Credits" label="Real backend data">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Credits are contributor metadata only. Planned splits do not create payouts or legal
          agreements.
        </p>
        <CreditFormDialog
          songId={songId}
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Add credit
            </Button>
          }
        />
      </div>
      {items.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((credit) => (
            <CreditRow key={credit.id} songId={songId} credit={credit} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No collaborators yet"
          detail="Add contributor credit metadata for this Song. Team accounts and legal split workflows are planned for later."
        />
      )}
    </Panel>
  );
}

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
      setError(
        caught instanceof Error ? caught.message : "The analytics snapshot could not be saved.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === "create" ? "Add manual snapshot" : "Edit manual snapshot"}
          </DialogTitle>
          <DialogDescription>
            This records manually entered analytics metadata only. It does not sync with YouTube or
            any external platform.
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
              Snapshot Date
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
              Watch Time Minutes
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
              Subscribers Gained
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
}: {
  songId: string;
  snapshot: AnalyticsSnapshot;
}) {
  const mutations = useAnalyticsSnapshotMutations(songId);

  return (
    <div className="grid gap-3 border border-border bg-background p-3 md:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium uppercase">
            {analyticsPlatformLabel(snapshot.platform)}
          </p>
          <span className="text-xs text-muted-foreground">{formatDate(snapshot.snapshotDate)}</span>
        </div>
        <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-5">
          <Info label="Views" value={formatNumber(snapshot.views)} />
          <Info label="Likes" value={formatNumber(snapshot.likes)} />
          <Info label="Comments" value={formatNumber(snapshot.comments)} />
          <Info label="Watch Time" value={formatWatchTime(snapshot.watchTimeMinutes)} />
          <Info label="Subscribers" value={formatNumber(snapshot.subscribersGained)} />
        </dl>
      </div>
      <div className="flex items-start gap-2">
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
              <AlertDialogTitle>Delete analytics snapshot</AlertDialogTitle>
              <AlertDialogDescription>
                This removes only DARKROOM SYSTEM analytics metadata. No YouTube, Spotify, TikTok,
                Instagram, or external platform data is affected.
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
    </div>
  );
}

function AnalyticsTab({ songId }: { songId: string }) {
  const snapshots = useQuery({
    queryKey: analyticsSnapshotsQueryKey(songId),
    queryFn: () => analyticsApi.getAnalyticsSnapshots(songId),
  });

  if (snapshots.isLoading) {
    return <LoadingState label="Loading analytics snapshots" />;
  }

  if (snapshots.isError) {
    return (
      <ErrorState
        detail="Analytics snapshots could not be loaded from the backend."
        onRetry={() => snapshots.refetch()}
      />
    );
  }

  const items = snapshots.data ?? [];
  const latest = items.at(-1);

  return (
    <div className="space-y-4">
      <Panel title="Analytics snapshots" label="Real backend data">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            These are manually recorded metadata snapshots. External analytics sync is planned for a
            later integration phase.
          </p>
          <AnalyticsSnapshotFormDialog
            songId={songId}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Add manual snapshot
              </Button>
            }
          />
        </div>
        {latest ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricBlock label="Views" value={formatNumber(latest.views)} />
            <MetricBlock label="Likes" value={formatNumber(latest.likes)} />
            <MetricBlock label="Comments" value={formatNumber(latest.comments)} />
            <MetricBlock label="Watch time" value={formatWatchTime(latest.watchTimeMinutes)} />
            <MetricBlock label="Subscribers" value={formatNumber(latest.subscribersGained)} />
          </div>
        ) : (
          <EmptyState
            title="No analytics snapshots yet"
            detail="Add a manual snapshot to start tracking Song performance metadata. YouTube ingestion is planned for later."
          />
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Panel title="Views over time" label="Manual snapshots">
          {items.length >= 2 ? (
            <>
              <MiniBars values={items.map((snapshot) => snapshot.views)} />
              <p className="mt-3 text-xs text-muted-foreground">
                Trend uses saved snapshot dates from {formatDate(items[0]!.snapshotDate)} to{" "}
                {formatDate(items.at(-1)!.snapshotDate)}.
              </p>
            </>
          ) : (
            <EmptyState
              title="Not enough data for trend"
              detail="Record at least two manual snapshots for this Song to show view movement over time."
            />
          )}
        </Panel>
        <Panel title="Snapshot history" label="Real metadata">
          {items.length ? (
            <div className="space-y-3">
              {items.map((snapshot) => (
                <AnalyticsSnapshotRow key={snapshot.id} songId={songId} snapshot={snapshot} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No history"
              detail="Saved analytics snapshots will appear here after the first manual entry."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

export function CalendarPage() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const range = useMemo(() => monthRange(visibleMonth), [visibleMonth]);
  const days = useMemo(() => calendarGridDays(visibleMonth), [visibleMonth]);
  const calendar = useQuery({
    queryKey: calendarQueryKey(range.from, range.to),
    queryFn: () => calendarApi.getCalendar(range.from, range.to),
  });
  const entries = useMemo(() => calendar.data ?? [], [calendar.data]);
  const entriesByDate = useMemo(() => groupCalendarEntriesByDate(entries), [entries]);
  const releaseCount = entries.filter((entry) => entry.eventType === "ReleaseDate").length;
  const dueCount = entries.filter((entry) => entry.eventType === "ContentDue").length;
  const scheduledCount = entries.filter((entry) => entry.eventType === "ContentScheduled").length;

  return (
    <AppShell>
      <PageHeader eyebrow="Calendar" title="Campaign schedule">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setVisibleMonth(shiftMonth(new Date(), 0))}>
            Current month
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricBlock label="This month" value={String(entries.length)} />
        <MetricBlock label="Releases" value={String(releaseCount)} />
        <MetricBlock label="Content due" value={String(dueCount)} />
        <MetricBlock label="Scheduled content" value={String(scheduledCount)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <Panel title={monthTitle(visibleMonth)} label="Real backend data">
          {calendar.isLoading ? (
            <LoadingState label="Loading calendar" />
          ) : calendar.isError ? (
            <ErrorState
              detail="Calendar entries could not be loaded from the backend."
              onRetry={() => calendar.refetch()}
            />
          ) : (
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                <p key={dayName} className="label-tech px-1 py-2 text-center">
                  {dayName}
                </p>
              ))}
              {days.map((day) => {
                const dateKey = toDateInputValue(day);
                const dayEntries = entriesByDate.get(dateKey) ?? [];
                const inMonth = day.getMonth() === visibleMonth.getMonth();

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "min-h-28 border border-border bg-background p-2 text-left",
                      !inMonth && "opacity-40",
                    )}
                  >
                    <p className="meta-tech">{day.getDate()}</p>
                    <div className="mt-2 space-y-1">
                      {dayEntries.slice(0, 3).map((entry) => (
                        <CalendarEntryChip key={calendarEntryKey(entry)} entry={entry} />
                      ))}
                      {dayEntries.length > 3 ? (
                        <p className="text-[10px] text-muted-foreground">
                          +{dayEntries.length - 3} more
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
        <Panel title="Agenda" label="Real backend data">
          {calendar.isLoading ? (
            <LoadingState label="Loading agenda" />
          ) : calendar.isError ? (
            <ErrorState
              detail="Agenda could not be loaded from the backend."
              onRetry={() => calendar.refetch()}
            />
          ) : entries.length ? (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Link
                  key={calendarEntryKey(entry)}
                  to="/songs/$songId"
                  params={{ songId: normalizeId(entry.songId) }}
                  className="block border-b border-border pb-3 last:border-0"
                >
                  <p className="label-tech">{calendarEventLabel(entry.eventType)}</p>
                  <p className="mt-1 text-sm font-medium">{entry.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(entry.date)} / {entry.songTitle}
                    {entry.platform ? ` / ${entry.platform}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.status} / Open Song</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No planning dates this month"
              detail="Release dates and Content due, scheduled, or published dates will appear here when they exist."
            />
          )}
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            Calendar reads Release and Content metadata. Google Calendar sync, reminders, and
            drag/drop rescheduling are planned for later milestones.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}

function CalendarEntryChip({ entry }: { entry: CalendarEntry }) {
  return (
    <Link
      to="/songs/$songId"
      params={{ songId: normalizeId(entry.songId) }}
      className={cn(
        "block truncate border px-1.5 py-1 text-[10px] uppercase text-foreground",
        entry.eventType === "ReleaseDate"
          ? "border-foreground bg-foreground text-background"
          : "border-border",
      )}
      title={`${calendarEventLabel(entry.eventType)} / ${entry.title} / ${entry.songTitle}`}
    >
      {calendarEventLabel(entry.eventType)}
    </Link>
  );
}

function groupCalendarEntriesByDate(entries: CalendarEntry[]) {
  return entries.reduce((grouped, entry) => {
    const dateEntries = grouped.get(entry.date) ?? [];
    dateEntries.push(entry);
    grouped.set(entry.date, dateEntries);
    return grouped;
  }, new Map<string, CalendarEntry[]>());
}

function calendarEntryKey(entry: CalendarEntry) {
  return `${entry.sourceType}-${entry.sourceId}-${entry.eventType}-${entry.date}`;
}

function calendarEventLabel(eventType: CalendarEventType) {
  return CALENDAR_EVENT_TYPE_LABELS[eventType];
}

export function TeamPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Team" title="Collaborators">
        <Button variant="outline">Invite</Button>
      </PageHeader>
      <Panel title="Members" label="Mock-only">
        <div className="grid gap-3 lg:grid-cols-2">
          {teamMembers.map((member) => (
            <FileRow
              key={member.id}
              title={member.name}
              meta={`${member.role} / ${member.email}`}
              status={
                member.projects.length === 1
                  ? member.projects[0]!
                  : `${member.projects.length} projects`
              }
              detail={`Last activity ${formatDate(member.lastActivity)}`}
            />
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const googleDriveQuery = useQuery({
    queryKey: googleDriveConnectionQueryKey,
    queryFn: googleDriveApi.getStatus,
  });

  const connectMutation = useMutation({
    mutationFn: googleDriveApi.connect,
    onSuccess: (response) => {
      openGoogleAuthorizationUrl(response.authorizationUrl);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: googleDriveApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleDriveConnectionQueryKey });
    },
  });

  return (
    <AppShell>
      <PageHeader eyebrow="Settings" title="Workspace controls" />
      <div className="grid gap-4 lg:grid-cols-2">
        {["Profile", "Workspace", "Notifications", "Appearance"].map((section) => (
          <Panel key={section} title={section} label="Frontend-only">
            <p className="text-sm text-muted-foreground">
              Settings UI placeholder for the current frontend architecture milestone.
            </p>
          </Panel>
        ))}
        <Panel title="Integrations" label="Connections" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <GoogleDriveIntegrationCard
              connection={googleDriveQuery.data}
              isLoading={googleDriveQuery.isLoading}
              error={googleDriveQuery.error}
              isConnecting={connectMutation.isPending}
              isDisconnecting={disconnectMutation.isPending}
              onConnect={() => connectMutation.mutate()}
              onDisconnect={() => disconnectMutation.mutate()}
            />
            <FileRow
              title="YouTube"
              meta="Performance analytics provider"
              status="Not Connected"
              detail="Coming later"
            />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function GoogleDriveIntegrationCard({
  connection,
  isLoading,
  error,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: {
  connection?: GoogleDriveConnectionStatus;
  isLoading: boolean;
  error: unknown;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const connected = connection?.connected === true;
  const needsAttention = connection?.status === "ReauthRequired";
  const title = "Google Drive";
  const status = needsAttention
    ? "Connection needs attention"
    : connected
      ? "Connected"
      : "Not connected";
  const detail = connected
    ? `Connected ${formatDate(connection.connectedAt ?? "")}`
    : needsAttention
      ? "Reconnect to restore backend access."
      : "Connect media storage access.";
  const actionLabel = needsAttention ? "Reconnect" : connected ? "Disconnect" : "Connect";
  const busy = isConnecting || isDisconnecting;

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label-tech">{title}</p>
          <p className="mt-2 text-sm text-muted-foreground">Media storage provider</p>
        </div>
        <span
          className={cn(
            "shrink-0 border px-2 py-1 text-[10px] uppercase",
            connected && !needsAttention
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground",
          )}
        >
          {isLoading ? "Checking" : status}
        </span>
      </div>

      <div className="mt-5 space-y-2">
        <p className="truncate text-sm font-medium">
          {connected || needsAttention ? connection?.email : "Not connected"}
        </p>
        <p className="text-xs uppercase text-muted-foreground">{isLoading ? "Loading" : detail}</p>
        {error ? (
          <p className="text-xs uppercase text-destructive">Google Drive status did not load.</p>
        ) : null}
      </div>

      <div className="mt-5">
        <Button
          variant={connected && !needsAttention ? "outline" : "default"}
          onClick={connected && !needsAttention ? onDisconnect : onConnect}
          disabled={busy || isLoading}
        >
          {busy ? "Working" : actionLabel}
        </Button>
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const authMutation = useMutation({
    mutationFn: () => {
      if (mode === "register") {
        return authApi.register({
          email: email.trim(),
          password,
          displayName: displayName.trim() || null,
        });
      }

      return authApi.login({ email: email.trim(), password });
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKey, user);
      navigate({ to: "/dashboard" });
    },
    onError: (caught) => {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    authMutation.mutate();
  }

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1.2fr_0.8fr]">
      <section className="relative hidden overflow-hidden border-r border-border p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 hairline-grid" />
        <div className="relative w-48">
          <Logo />
        </div>
        <div className="relative max-w-2xl">
          <p className="label-tech">DARKROOM SYSTEM</p>
          <h1 className="mt-4 display-xl uppercase">Music workflow control room</h1>
          <p className="mt-5 text-sm text-muted-foreground">
            First-party DARKROOM SYSTEM authentication backed by the ASP.NET API.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 w-48 lg:hidden">
            <Logo />
          </div>
          <p className="label-tech">{mode === "register" ? "Create account" : "Sign in"}</p>
          <h2 className="mt-3 display-lg uppercase">DARKROOM SYSTEM</h2>
          <form className="mt-8 space-y-4" onSubmit={submit}>
            <div>
              <label className="label-tech" htmlFor="auth-email">
                Email
              </label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2"
                required
              />
            </div>
            {mode === "register" ? (
              <div>
                <label className="label-tech" htmlFor="auth-display-name">
                  Display name
                </label>
                <Input
                  id="auth-display-name"
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-2"
                />
              </div>
            ) : null}
            <div>
              <label className="label-tech" htmlFor="auth-password">
                Password
              </label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2"
                required
                minLength={8}
              />
            </div>
            {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
            <Button className="w-full" disabled={authMutation.isPending}>
              {authMutation.isPending
                ? "Working"
                : mode === "register"
                  ? "Create account"
                  : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setError("");
                setMode(mode === "register" ? "login" : "register");
              }}
            >
              {mode === "register" ? "Use existing account" : "Create account"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background p-3">
      <dt className="label-tech">{label}</dt>
      <dd className="mt-2 font-medium uppercase">{value}</dd>
    </div>
  );
}

function FileRow({
  title,
  meta,
  status,
  detail,
}: {
  title: string;
  meta: string;
  status: string;
  detail?: string;
}) {
  return (
    <div className="border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      {detail ? <p className="mt-3 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function Timeline({
  items,
}: {
  items: { id: string; title: string; meta: string; detail?: string }[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-[18px_1fr] gap-3">
          <div className="pt-1.5">
            <span className="block h-2 w-2 bg-foreground" />
          </div>
          <div className="border-b border-border pb-3 last:border-0">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
            {item.detail ? <p className="mt-1 text-xs text-subtle">{item.detail}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
