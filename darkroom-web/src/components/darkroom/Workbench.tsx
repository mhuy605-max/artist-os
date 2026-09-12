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
  X,
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
import {
  collaborationApi,
  invitationInboxQueryKey,
  songMembersQueryKey,
} from "@/services/api/collaboration";
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
  type InvitationInboxItem,
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
  type SongInvitation,
  type SongPayload,
  type SongStatus,
  type VisualAsset,
  type VisualAssetPayload,
  type VisualAssetStatus,
  type VisualAssetType,
} from "@/types";
import { cn } from "@/lib/utils";
import { deriveSongAccess, parseApiProblemTitle, songRoleLabel } from "./workbench/shared";

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
  const access = deriveSongAccess(song);

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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase text-muted-foreground">Open workspace</p>
            {!access.isOwner ? (
              <span className="border border-border px-2 py-1 text-xs uppercase text-muted-foreground">
                {songRoleLabel(access)}
              </span>
            ) : null}
          </div>
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
          {item.completedItems} / {item.totalItems} ready
        </span>
        <span>{item.readinessPercentage}%</span>
      </div>
    </Link>
  );
}

function analyticsPlatformLabel(platform: AnalyticsPlatform) {
  return ANALYTICS_PLATFORM_LABELS[platform] ?? platform;
}

function formatWatchTime(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
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
                data-song-row
                className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto]"
              >
                <SongCard song={song} />
                {(() => {
                  const access = deriveSongAccess(song);

                  if (!access.canEdit && !access.canDeleteSong) return null;

                  return (
                    <div className="flex gap-2 xl:flex-col">
                      {access.canEdit ? (
                        <SongFormDialog
                          mode="edit"
                          song={song}
                          trigger={
                            <Button variant="outline" size="sm" className="min-w-24">
                              Edit
                            </Button>
                          }
                        />
                      ) : null}
                      {access.canDeleteSong ? (
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
                      ) : null}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export { SongWorkspacePage } from "./workbench/Workbench";

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
      <InvitationInbox />
    </AppShell>
  );
}

function InvitationInbox() {
  const invitations = useQuery({
    queryKey: invitationInboxQueryKey,
    queryFn: collaborationApi.getInvitations,
    retry: false,
  });

  return (
    <>
      <PageHeader eyebrow="Team" title="Song invitations" />
      <Panel title="Invitation inbox" label="Collaboration">
        {invitations.isLoading ? (
          <LoadingState label="Loading invitations" />
        ) : invitations.isError ? (
          <ErrorState
            title="Invitations unavailable"
            detail="Your pending song invitations could not be loaded."
            onRetry={() => invitations.refetch()}
          />
        ) : invitations.data?.length ? (
          <div className="divide-y divide-border border border-border bg-panel">
            {invitations.data.map((invitation) => (
              <InvitationInboxRow key={String(invitation.invitationId)} invitation={invitation} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pending invitations"
            detail="Song workspace invitations for your account will appear here."
          />
        )}
      </Panel>
    </>
  );
}

function InvitationInboxRow({ invitation }: { invitation: InvitationInboxItem }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const invitationId = String(invitation.invitationId);
  const invalidateInvitationState = (response?: SongInvitation) => {
    queryClient.invalidateQueries({ queryKey: invitationInboxQueryKey });
    queryClient.invalidateQueries({ queryKey: songsQueryKey });
    queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    queryClient.invalidateQueries({ queryKey: ["calendar"] });
    const songId = String(response?.songId ?? invitation.songId);
    queryClient.invalidateQueries({ queryKey: ["songs", songId] });
    queryClient.invalidateQueries({ queryKey: songMembersQueryKey(songId) });
  };
  const accept = useMutation({
    mutationFn: () => collaborationApi.acceptInvitation(invitationId),
    onSuccess: (response) => {
      setMessage("Invitation accepted.");
      invalidateInvitationState(response);
    },
    onError: (error) => {
      setMessage(invitationActionError(error, "Invitation could not be accepted."));
      invalidateInvitationState();
    },
  });
  const decline = useMutation({
    mutationFn: () => collaborationApi.declineInvitation(invitationId),
    onSuccess: (response) => {
      setMessage("Invitation declined.");
      invalidateInvitationState(response);
    },
    onError: (error) => {
      setMessage(invitationActionError(error, "Invitation could not be declined."));
      invalidateInvitationState();
    },
  });
  const busy = accept.isPending || decline.isPending;
  const inviter = invitation.invitedByUser.displayName?.trim() || invitation.invitedByUser.email;

  return (
    <article className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="min-w-0">
        <p className="label-tech">Song workspace</p>
        <Link
          to="/songs/$songId"
          params={{ songId: String(invitation.songId) }}
          className="mt-2 block truncate text-lg font-semibold uppercase hover:text-muted-foreground"
          title={invitation.songTitle}
        >
          {invitation.songTitle}
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">
          Invited by {inviter} as {invitationRoleLabel(invitation.role)}.
        </p>
        <p className="mt-1 text-xs uppercase text-muted-foreground">
          Received {formatDate(invitation.createdAt)}
        </p>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
        <Button
          className="gap-2"
          disabled={busy}
          onClick={() => {
            if (!busy) accept.mutate();
          }}
        >
          <Check className="h-4 w-4" />
          {accept.isPending ? "Accepting" : "Accept"}
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          disabled={busy}
          onClick={() => {
            if (!busy) decline.mutate();
          }}
        >
          <X className="h-4 w-4" />
          {decline.isPending ? "Declining" : "Decline"}
        </Button>
      </div>
    </article>
  );
}

function invitationRoleLabel(role: string) {
  if (role === "EDITOR") return "Editor";
  if (role === "VIEWER") return "Viewer";
  return role;
}

function invitationActionError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 404) return "Invitation is no longer available.";
    if (error.status === 403) return "You no longer have permission to manage this action.";
    if (error.status === 409)
      return parseApiProblemTitle(error) || "Invitation is no longer pending.";
    return parseApiProblemTitle(error) || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
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
                maxLength={200}
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
