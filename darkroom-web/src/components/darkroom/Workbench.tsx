import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

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
import { audioAssetsApi } from "@/services/api/audioAssets";
import { calendarApi } from "@/services/api/calendar";
import { contentItemsApi } from "@/services/api/contentItems";
import { creditsApi } from "@/services/api/credits";
import { releaseChecklistApi } from "@/services/api/releaseChecklist";
import { releasesApi } from "@/services/api/releases";
import { songsApi, isUsingFallbackData } from "@/services/api/songs";
import { visualAssetsApi } from "@/services/api/visualAssets";
import { workspacePerformance } from "@/services/mock/analytics";
import {
  getSongActivity,
  getSongTasks,
  globalActivity,
  upcomingItems,
} from "@/services/mock/activity";
import { getSongMeta } from "@/services/mock/songs";
import { teamMembers, getSongTeam } from "@/services/mock/team";
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
  SONG_LIFECYCLE,
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
      Development fallback active: the real Song API is unreachable, so this view is using the
      isolated mock song store.
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
            {mode === "create" ? "Create song" : "Edit song"}
          </DialogTitle>
          <DialogDescription>
            Title and status are the only writable Song fields. CreatedAt is controlled by the
            backend.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="label-tech" htmlFor={`${mode}-title`}>
              Title
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
            <label className="label-tech">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as SongStatus)}>
              <SelectTrigger className="mt-2">
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
          {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
          <div className="flex justify-end gap-2">
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

function SongCard({ song }: { song: Song }) {
  const meta = getSongMeta(normalizeId(song.id));

  return (
    <article className="border border-border bg-panel p-4 transition-colors hover:border-border-strong">
      <div className="aspect-square border border-border bg-background p-3">
        <div className="flex h-full flex-col justify-between bg-[linear-gradient(135deg,var(--color-panel),var(--color-background))] p-3">
          <p className="label-tech">{meta.artist}</p>
          <p className="text-2xl font-semibold uppercase leading-none">{song.title}</p>
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/songs/$songId"
            params={{ songId: normalizeId(song.id) }}
            className="font-medium uppercase hover:underline"
          >
            {song.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {meta.genre} / {meta.bpm} BPM
          </p>
        </div>
        <StatusBadge status={song.status} />
      </div>
      <div className="mt-4 h-1 bg-background">
        <div className="h-full bg-foreground" style={{ width: `${meta.progress}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {meta.releaseDate ? `Release ${formatDate(meta.releaseDate)}` : "No release date"}
        </span>
        <span>{meta.collaborators.length} people</span>
      </div>
    </article>
  );
}

function LifecycleProgress({ status }: { status: string }) {
  const currentIndex = Math.max(
    0,
    SONG_LIFECYCLE.findIndex((item) => item === status),
  );

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {SONG_LIFECYCLE.map((item, index) => (
        <div
          key={item}
          className={cn(
            "border p-3",
            index < currentIndex && "border-border bg-panel text-muted-foreground",
            index === currentIndex && "border-foreground bg-foreground text-background",
            index > currentIndex && "border-border bg-background text-subtle",
          )}
        >
          <p className="font-mono text-xs">{String(index + 1).padStart(2, "0")}</p>
          <p className="mt-2 text-sm font-medium uppercase">{SONG_STATUS_LABELS[item]}</p>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const songs = useSongs();
  const activeSongs = (songs.data ?? []).slice(0, 4);

  return (
    <AppShell>
      <PageHeader eyebrow="Dashboard" title="Command center" />
      <FallbackNotice />
      {songs.isLoading ? (
        <LoadingState label="Loading songs" />
      ) : songs.isError ? (
        <ErrorState
          detail="The Song API returned an error. Start the backend or check the API response."
          onRetry={() => songs.refetch()}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Panel title="Active projects" label="Real songs + mock metadata">
            {activeSongs.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {activeSongs.map((song) => (
                  <SongCard key={normalizeId(song.id)} song={song} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No songs yet"
                detail="Create songs from the Songs page to populate active projects."
              />
            )}
          </Panel>
          <Panel title="Upcoming" label="Mock schedule">
            <div className="space-y-3">
              {upcomingItems.slice(0, 7).map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[74px_1fr] gap-3 border-b border-border pb-3 last:border-0"
                >
                  <p className="meta-tech">{formatDate(item.date)}</p>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.song} / {item.kind}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Recent activity" label="Mock feed">
            <Timeline
              items={globalActivity.map((item) => ({
                id: item.id,
                title: item.action,
                meta: `${item.actor} / ${formatDate(item.at)}`,
                detail: item.songTitle,
              }))}
            />
          </Panel>
          <Panel title="Performance snapshot" label="Mock analytics">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricBlock
                label="Total views"
                value={formatNumber(workspacePerformance.totalViews)}
                detail="+18.4% / 30d"
              />
              <MetricBlock
                label="Top release"
                value={workspacePerformance.topRelease}
                detail={`${formatNumber(workspacePerformance.topReleaseViews)} views`}
              />
              <MetricBlock
                label="Content posts"
                value={String(workspacePerformance.contentPosts)}
                detail="Campaign output"
              />
              <MetricBlock
                label="Avg content"
                value={formatNumber(workspacePerformance.avgContentViews)}
                detail="Mock performance"
              />
            </div>
            <div className="mt-4">
              <MiniBars values={workspacePerformance.monthly.map((item) => item.value)} />
            </div>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}

export function SongsPage() {
  const songs = useSongs();
  const mutations = useSongMutations();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("created-desc");

  const filtered = useMemo(() => {
    return [...(songs.data ?? [])]
      .filter((song) => song.title.toLowerCase().includes(query.trim().toLowerCase()))
      .filter((song) => status === "all" || song.status === status)
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "status") return statusLabel(a.status).localeCompare(statusLabel(b.status));
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [songs.data, query, status, sort]);

  return (
    <AppShell>
      <PageHeader eyebrow="Songs" title="Project index">
        <SongFormDialog
          mode="create"
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Create song
            </Button>
          }
        />
      </PageHeader>
      <FallbackNotice />
      <Panel>
        <div className="grid gap-3 lg:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search songs"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
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
            <SelectTrigger>
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

      <div className="mt-4">
        {songs.isLoading ? (
          <LoadingState label="Loading songs" />
        ) : songs.isError ? (
          <ErrorState
            detail="The real Song API returned an error. Mock fallback is only used when the API host is unreachable."
            onRetry={() => songs.refetch()}
          />
        ) : (songs.data ?? []).length === 0 ? (
          <EmptyState
            title="No songs yet"
            detail="Create the first song to begin building the workspace."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matching songs"
            detail="Clear the search or status filter to see more projects."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((song) => (
              <div key={normalizeId(song.id)} className="relative">
                <SongCard song={song} />
                <div className="mt-2 flex gap-2">
                  <SongFormDialog
                    mode="edit"
                    song={song}
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
                        <AlertDialogTitle>Delete song</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the Song record from the current Song API. Future asset mocks
                          are not persisted.
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

export function SongWorkspacePage({ songId }: { songId: string }) {
  const songQuery = useQuery({
    queryKey: ["songs", songId],
    queryFn: () => songsApi.getSong(songId),
  });

  return (
    <AppShell>
      {songQuery.isLoading ? (
        <LoadingState label="Loading workspace" />
      ) : songQuery.isError ? (
        <ErrorState
          detail="This song could not be loaded from the Song API or the explicit development fallback."
          onRetry={() => songQuery.refetch()}
        />
      ) : songQuery.data ? (
        <Workspace song={songQuery.data} />
      ) : (
        <EmptyState
          title="Song not found"
          detail="Return to the song index and choose an active project."
        />
      )}
    </AppShell>
  );
}

function Workspace({ song }: { song: Song }) {
  const id = normalizeId(song.id);
  const meta = getSongMeta(id);

  return (
    <>
      <FallbackNotice />
      <div className="mb-5 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="aspect-square border border-border bg-panel p-4">
          <div className="flex h-full items-end bg-background p-4">
            <p className="text-3xl font-semibold uppercase leading-none">{song.title}</p>
          </div>
        </div>
        <div className="flex flex-col justify-between border-b border-border pb-5">
          <div>
            <p className="label-tech">Song workspace</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="display-xl uppercase">{song.title}</h1>
              <StatusBadge status={song.status} size="md" />
            </div>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{meta.notes}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricBlock label="Artist" value={meta.artist} />
            <MetricBlock
              label="Release"
              value={meta.releaseDate ? formatDate(meta.releaseDate) : "Unscheduled"}
            />
            <MetricBlock label="Created" value={formatDate(song.createdAt) ?? "-"} />
            <MetricBlock label="Updated" value={formatDate(meta.lastUpdated) ?? "-"} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 h-auto w-full justify-start overflow-x-auto rounded-none border border-border bg-panel p-1">
          {["overview", "audio", "visuals", "release", "content", "credits", "analytics"].map(
            (tab) => (
              <TabsTrigger key={tab} value={tab} className="rounded-none uppercase">
                {tab}
              </TabsTrigger>
            ),
          )}
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab song={song} />
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

function OverviewTab({ song }: { song: Song }) {
  const id = normalizeId(song.id);
  const meta = getSongMeta(id);
  const tasks = getSongTasks(id);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Panel title="Lifecycle progress" label="Real status">
        <LifecycleProgress status={song.status} />
      </Panel>
      <Panel title="Project info" label="Real + mock">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Title" value={song.title} />
          <Info label="Status" value={statusLabel(song.status)} />
          <Info label="Artist" value={meta.artist} />
          <Info label="BPM" value={String(meta.bpm)} />
          <Info label="Key" value={meta.songKey} />
          <Info label="Genre" value={meta.genre} />
        </dl>
        <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
          {meta.notes}
        </p>
      </Panel>
      <Panel title="Upcoming tasks" label="Mock task list">
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 border-b border-border pb-3 last:border-0"
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center border",
                  task.done ? "bg-foreground text-background" : "border-border",
                )}
              >
                {task.done ? <Check className="h-3 w-3" /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{task.label}</p>
                <p className="text-xs text-muted-foreground">
                  {task.owner} / {formatDate(task.due)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Team / activity" label="Mock collaboration">
        <div className="mb-4 flex flex-wrap gap-2">
          {getSongTeam(id).map((member) => (
            <span key={member.id} className="border border-border px-2 py-1 text-xs">
              {member.name} / {member.role}
            </span>
          ))}
        </div>
        <Timeline
          items={getSongActivity(id).map((item) => ({
            id: item.id,
            title: item.action,
            meta: `${item.actor} / ${formatDate(item.at)}`,
          }))}
        />
      </Panel>
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
            This saves metadata only. Actual audio file upload and external storage are planned for
            a later milestone.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label-tech" htmlFor={`${mode}-audio-file-name-${asset?.id ?? "new"}`}>
              File name
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
              Duration seconds
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
          </div>
          <div>
            <label className="label-tech" htmlFor={`${mode}-audio-size-${asset?.id ?? "new"}`}>
              File size MB
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

function AudioAssetRow({ songId, asset }: { songId: string; asset: AudioAsset }) {
  const mutations = useAudioAssetMutations(songId);

  return (
    <div className="border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{asset.fileName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            v{asset.version} / {formatDuration(asset.durationSeconds)} /{" "}
            {formatFileSize(asset.fileSizeBytes)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {asset.isCurrent ? (
            <span className="border border-border px-2 py-1 text-xs">Current</span>
          ) : null}
          <StatusBadge status={asset.status} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Added {formatDate(asset.uploadedAt)}</p>
        <div className="flex gap-2">
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
                <AlertDialogTitle>Delete audio asset metadata</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes only the saved metadata record. No external audio file will be
                  deleted because file storage is not implemented yet.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => mutations.remove.mutate(String(asset.id))}>
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

function AudioTab({ songId }: { songId: string }) {
  const audioAssets = useQuery({
    queryKey: audioAssetsQueryKey(songId),
    queryFn: () => audioAssetsApi.getAudioAssets(songId),
  });

  if (audioAssets.isLoading) {
    return <LoadingState label="Loading audio metadata" />;
  }

  if (audioAssets.isError) {
    return (
      <ErrorState
        detail="Audio asset metadata could not be loaded from the backend."
        onRetry={() => audioAssets.refetch()}
      />
    );
  }

  const assets = audioAssets.data ?? [];

  return (
    <div className="space-y-4">
      <Panel title="Audio metadata" label="Real backend data">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Metadata is persisted through the ASP.NET API. Actual file upload, playback, and
            waveform generation are planned for later.
          </p>
          <AudioAssetFormDialog
            songId={songId}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Add asset
              </Button>
            }
          />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {AUDIO_ASSET_TYPES.map((type) => {
          const scoped = assets.filter((asset) => asset.type === type);
          return (
            <Panel key={type} title={type} label="Real metadata">
              <div className="mb-3 h-16 border border-border bg-background p-3">
                <MiniBars
                  values={scoped.length ? [18, 42, 28, 64, 35, 52, 24, 46] : [8, 8, 8, 8]}
                />
              </div>
              {scoped.length ? (
                <div className="space-y-3">
                  {scoped.map((asset) => (
                    <AudioAssetRow key={asset.id} songId={songId} asset={asset} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No ${type.toLowerCase()} metadata`}
                  detail="Add an asset metadata record now. Google Drive file association will arrive in a later milestone."
                />
              )}
            </Panel>
          );
        })}
      </div>
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
  return `${width} x ${height}`;
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
            This saves metadata only. Actual image/video upload, previews, and external storage are
            planned for a later milestone.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              className="label-tech"
              htmlFor={`${mode}-visual-file-name-${asset?.id ?? "new"}`}
            >
              File name
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
              File size MB
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

function VisualAssetRow({ songId, asset }: { songId: string; asset: VisualAsset }) {
  const mutations = useVisualAssetMutations(songId);

  return (
    <div className="border border-border bg-background p-3">
      <div className="aspect-video border border-border bg-panel p-3">
        <div className="flex h-full items-end justify-between border border-dashed border-border p-3">
          <span className="label-tech">{visualTypeLabel(asset.type)}</span>
          <span className="text-xs text-muted-foreground">Placeholder</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{asset.fileName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            v{asset.version} / {formatDimensions(asset.width, asset.height)} /{" "}
            {formatFileSize(asset.fileSizeBytes)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {asset.isCurrent ? (
            <span className="border border-border px-2 py-1 text-xs">Current</span>
          ) : null}
          <StatusBadge status={visualStatusLabel(asset.status)} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Added {formatDate(asset.uploadedAt)}</p>
        <div className="flex gap-2">
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
                <AlertDialogTitle>Delete visual asset metadata</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes only the saved metadata record. No external image or video file will
                  be deleted because file storage is not implemented yet.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => mutations.remove.mutate(String(asset.id))}>
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

function VisualsTab({ songId }: { songId: string }) {
  const visualAssets = useQuery({
    queryKey: visualAssetsQueryKey(songId),
    queryFn: () => visualAssetsApi.getVisualAssets(songId),
  });

  if (visualAssets.isLoading) {
    return <LoadingState label="Loading visual metadata" />;
  }

  if (visualAssets.isError) {
    return (
      <ErrorState
        detail="Visual asset metadata could not be loaded from the backend."
        onRetry={() => visualAssets.refetch()}
      />
    );
  }

  const assets = visualAssets.data ?? [];

  return (
    <div className="space-y-4">
      <Panel title="Visual metadata" label="Real backend data">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Metadata is persisted through the ASP.NET API. Thumbnails, file upload, playback, and
            Google Drive association are placeholders for later milestones.
          </p>
          <VisualAssetFormDialog
            songId={songId}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Add asset
              </Button>
            }
          />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {VISUAL_ASSET_TYPES.map((type) => {
          const scoped = assets.filter((asset) => asset.type === type);
          return (
            <Panel key={type} title={visualTypeLabel(type)} label="Real metadata">
              {scoped.length ? (
                <div className="space-y-3">
                  {scoped.map((asset) => (
                    <VisualAssetRow key={asset.id} songId={songId} asset={asset} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No ${visualTypeLabel(type).toLowerCase()} metadata`}
                  detail="Add a visual metadata record now. Actual media upload and preview generation will arrive in a later milestone."
                />
              )}
            </Panel>
          );
        })}
      </div>
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
            {mode === "create" ? "Create release plan" : "Edit release plan"}
          </DialogTitle>
          <DialogDescription>
            This saves release planning metadata only. Distributor delivery and publishing are
            planned for later milestones.
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
            <Select
              value={releaseType}
              onValueChange={(value) => setReleaseType(value as ReleaseType)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELEASE_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {releaseTypeLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <p className="label-tech">Platforms</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {RELEASE_PLATFORMS.map((platform) => (
                <label key={platform} className="flex items-center gap-2 text-sm">
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
  const mutations = useReleaseMutations(songId);

  if (release.isLoading) {
    return <LoadingState label="Loading release metadata" />;
  }

  if (release.isError) {
    return (
      <ErrorState
        detail="Release metadata could not be loaded from the backend."
        onRetry={() => release.refetch()}
      />
    );
  }

  const releasePlan = release.data;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <Panel title="Release metadata" label="Real backend data">
        {releasePlan ? (
          <>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Info
                label="Date"
                value={
                  releasePlan.releaseDate ? formatDate(releasePlan.releaseDate) : "Not scheduled"
                }
              />
              <Info label="Distributor" value={releasePlan.distributor ?? "Not selected"} />
              <Info label="ISRC" value={releasePlan.isrc ?? "Not assigned"} />
              <Info label="UPC" value={releasePlan.upc ?? "Not assigned"} />
              <Info label="Type" value={releaseTypeLabel(releasePlan.releaseType)} />
              <Info label="Status" value={releaseStatusLabel(releasePlan.status)} />
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
            <div className="mt-4 flex flex-wrap gap-2">
              <ReleaseFormDialog
                songId={songId}
                release={releasePlan}
                trigger={<Button variant="outline">Edit</Button>}
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
                    <AlertDialogTitle>Delete release metadata</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes only the saved release plan. The Song, audio assets, visual
                      assets, and any future external files are not deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => mutations.remove.mutate()}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Created {formatDate(releasePlan.createdAt)} / Updated{" "}
              {formatDate(releasePlan.updatedAt)}
            </p>
          </>
        ) : (
          <div className="flex min-h-36 flex-col items-center justify-center border border-dashed border-border p-6 text-center">
            <p className="text-sm font-medium uppercase">No release plan yet</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Create Release Plan to persist release metadata for this Song.
            </p>
            <ReleaseFormDialog
              songId={songId}
              trigger={
                <Button className="mt-4">
                  <Plus className="h-4 w-4" />
                  Create Release Plan
                </Button>
              }
            />
          </div>
        )}
      </Panel>
      <ReleaseChecklistPanel songId={songId} hasRelease={Boolean(releasePlan)} />
    </div>
  );
}

function ReleaseChecklistPanel({ songId, hasRelease }: { songId: string; hasRelease: boolean }) {
  const checklist = useQuery({
    queryKey: releaseChecklistQueryKey(songId),
    queryFn: () => releaseChecklistApi.getChecklist(songId),
    enabled: hasRelease,
  });
  const mutations = useReleaseChecklistMutations(songId);

  if (!hasRelease) {
    return (
      <Panel title="Preparation checklist" label="Real backend data">
        <EmptyState
          title="No checklist yet"
          detail="Create a release plan to initialize the standard preparation checklist."
        />
      </Panel>
    );
  }

  if (checklist.isLoading) {
    return (
      <Panel title="Preparation checklist" label="Real backend data">
        <LoadingState label="Loading release checklist" />
      </Panel>
    );
  }

  if (checklist.isError) {
    return (
      <Panel title="Preparation checklist" label="Real backend data">
        <ErrorState
          detail="Release checklist could not be loaded from the backend."
          onRetry={() => checklist.refetch()}
        />
      </Panel>
    );
  }

  const items = checklist.data ?? [];
  const completedCount = items.filter((item) => item.isCompleted).length;
  const progressPercent = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <Panel title="Preparation checklist" label="Real backend data">
      <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-2xl">
            {completedCount} / {items.length} COMPLETE
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {progressPercent}% checklist readiness. No external distributor delivery happens here.
          </p>
        </div>
        <div className="h-2 w-full bg-muted sm:w-40">
          <div
            className="h-full bg-foreground"
            style={{ width: `${progressPercent}%` }}
            aria-hidden="true"
          />
        </div>
      </div>
      <div className="grid gap-3">
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
      <div className="flex items-start gap-3">
        <Checkbox
          aria-label={`${item.label} checklist item`}
          checked={item.isCompleted}
          disabled={isPending}
          onCheckedChange={(checked) => updateCompletion(checked === true)}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs uppercase text-muted-foreground">
              {item.isCompleted && item.completedAt
                ? `Completed ${formatDate(item.completedAt)}`
                : "Open"}
            </p>
          </div>
          <Textarea
            value={notes}
            maxLength={1000}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional checklist notes"
            className="mt-3 min-h-16"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
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
          {error ? <p className="mt-2 text-xs text-muted-foreground">{error}</p> : null}
        </div>
      </div>
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
            This saves planning metadata only. Published status does not post to any platform.
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
              placeholder="Publishing and platform actions are planned for later."
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

  return (
    <div className="border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {contentTypeLabel(item.type)} / {contentPlatformLabel(item.platform)} /{" "}
            {item.ownerName ?? "Unassigned"}
          </p>
        </div>
        <StatusBadge status={contentStatusLabel(item.status)} />
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          <dt className="label-tech">Due</dt>
          <dd>{item.dueDate ? formatDate(item.dueDate) : "Not set"}</dd>
        </div>
        <div>
          <dt className="label-tech">Scheduled</dt>
          <dd>{item.scheduledAt ? formatDate(item.scheduledAt) : "Not set"}</dd>
        </div>
        <div>
          <dt className="label-tech">Published</dt>
          <dd>{item.publishedAt ? formatDate(item.publishedAt) : "Metadata only"}</dd>
        </div>
      </dl>
      {item.notes ? <p className="mt-3 text-xs text-muted-foreground">{item.notes}</p> : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Updated {formatDate(item.updatedAt)} / no platform publish action
        </p>
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
                <AlertDialogTitle>Delete content metadata</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes only the planning metadata. No social post, scheduled publish, or
                  uploaded media will be deleted.
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
    </div>
  );
}

function ContentTab({ songId }: { songId: string }) {
  const contentItems = useQuery({
    queryKey: contentItemsQueryKey(songId),
    queryFn: () => contentItemsApi.getContentItems(songId),
  });

  if (contentItems.isLoading) {
    return <LoadingState label="Loading content metadata" />;
  }

  if (contentItems.isError) {
    return (
      <ErrorState
        detail="Content metadata could not be loaded from the backend."
        onRetry={() => contentItems.refetch()}
      />
    );
  }

  const items = contentItems.data ?? [];

  return (
    <Panel title="Campaign content" label="Real backend data">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Content items are planning metadata only. Changing status to Published does not post to
          any platform.
        </p>
        <ContentItemFormDialog
          songId={songId}
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Add content
            </Button>
          }
        />
      </div>
      {items.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {items.map((item) => (
            <ContentItemRow key={item.id} songId={songId} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No content planned"
          detail="Add content planning metadata for this Song. Publishing integrations are planned for later."
        />
      )}
    </Panel>
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
        <Panel title="Integrations" label="Coming later" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <FileRow
              title="Google Drive"
              meta="Media storage provider"
              status="Not Connected"
              detail="Coming later"
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

export function LoginPage() {
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
            Frontend-only login shell. Authentication is planned for a later backend phase.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 w-48 lg:hidden">
            <Logo />
          </div>
          <p className="label-tech">Sign in</p>
          <h2 className="mt-3 display-lg uppercase">DARKROOM SYSTEM</h2>
          <div className="mt-8 space-y-4">
            <Input type="email" placeholder="Email" />
            <Input type="password" placeholder="Password" />
            <Button className="w-full">Sign in</Button>
            <p className="text-xs text-muted-foreground">
              Mock-only. No authentication request is sent.
            </p>
          </div>
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
