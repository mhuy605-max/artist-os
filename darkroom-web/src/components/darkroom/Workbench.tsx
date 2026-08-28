import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
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
import { songsApi, isUsingFallbackData } from "@/services/api/songs";
import { getAnalytics, workspacePerformance } from "@/services/mock/analytics";
import {
  AUDIO_STAGES,
  getAudioAssets,
  getVisualAssets,
  VISUAL_CATEGORIES,
} from "@/services/mock/assets";
import { calendarEvents } from "@/services/mock/calendar";
import { getContentItems } from "@/services/mock/content";
import { getCredits } from "@/services/mock/credits";
import { getRelease } from "@/services/mock/release";
import {
  getSongActivity,
  getSongTasks,
  globalActivity,
  upcomingItems,
} from "@/services/mock/activity";
import { getSongMeta } from "@/services/mock/songs";
import { teamMembers, getSongTeam } from "@/services/mock/team";
import {
  SONG_LIFECYCLE,
  SONG_STATUS_LABELS,
  SONG_STATUSES,
  type Song,
  type SongPayload,
  type SongStatus,
} from "@/types";
import { cn } from "@/lib/utils";

const songsQueryKey = ["songs"];

function useSongs() {
  return useQuery({
    queryKey: songsQueryKey,
    queryFn: songsApi.getSongs,
  });
}

function normalizeId(id: Song["id"]) {
  return String(id);
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

function AudioTab({ songId }: { songId: string }) {
  const assets = getAudioAssets(songId);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {AUDIO_STAGES.map((stage) => {
        const scoped = assets.filter((asset) => asset.stage === stage);
        return (
          <Panel key={stage} title={stage} label="Mock audio assets">
            {scoped.length ? (
              scoped.map((asset) => (
                <FileRow
                  key={asset.id}
                  title={asset.filename}
                  meta={`${asset.version} / ${asset.duration} / ${asset.sizeMb} MB`}
                  status={asset.status}
                  detail={asset.note}
                />
              ))
            ) : (
              <EmptyState
                title={`No ${stage.toLowerCase()} uploaded`}
                detail="Google Drive file association will arrive in a later milestone."
              />
            )}
          </Panel>
        );
      })}
    </div>
  );
}

function VisualsTab({ songId }: { songId: string }) {
  const assets = getVisualAssets(songId);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {VISUAL_CATEGORIES.map((category) => {
        const scoped = assets.filter((asset) => asset.category === category);
        return scoped.length ? (
          scoped.map((asset) => (
            <AssetCard
              key={asset.id}
              title={asset.filename}
              category={category}
              status={asset.state}
              meta={`${asset.version} / ${asset.creator} / ${formatDate(asset.lastUpdated)}`}
            />
          ))
        ) : (
          <AssetCard
            key={category}
            title="No asset"
            category={category}
            status="Missing"
            meta="Mock-only placeholder"
          />
        );
      })}
    </div>
  );
}

function ReleaseTab({ songId }: { songId: string }) {
  const release = getRelease(songId);
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <Panel title="Release metadata" label="Mock-only">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Date" value={formatDate(release.releaseDate) ?? release.releaseDate} />
          <Info label="Distributor" value={release.distributor} />
          <Info label="ISRC" value={release.isrc} />
          <Info label="UPC" value={release.upc} />
          <Info label="Type" value={release.releaseType} />
          <Info label="Status" value={release.stage} />
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {release.platforms.map((platform) => (
            <span key={platform} className="border border-border px-2 py-1 text-xs">
              {platform}
            </span>
          ))}
        </div>
      </Panel>
      <Panel title="Preparation checklist" label="Mock-only">
        <div className="grid gap-2 sm:grid-cols-2">
          {release.checklist.map((item) => (
            <div
              key={item.item}
              className="flex items-center gap-3 border border-border bg-background p-3"
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center border",
                  item.done ? "bg-foreground text-background" : "border-border",
                )}
              >
                {item.done ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="text-sm">{item.item}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ContentTab({ songId }: { songId: string }) {
  const items = getContentItems(songId);
  return (
    <Panel title="Campaign content" label="Mock-only">
      {items.length ? (
        <Timeline
          items={items.map((item) => ({
            id: item.id,
            title: item.title,
            meta: `${item.type} / ${item.stage} / ${item.platform}`,
            detail: item.scheduledFor ? formatDate(item.scheduledFor) : item.owner,
          }))}
        />
      ) : (
        <EmptyState
          title="No content planned"
          detail="Content planning backend will arrive in a later phase."
        />
      )}
    </Panel>
  );
}

function CreditsTab({ songId }: { songId: string }) {
  const credits = getCredits(songId);
  return (
    <Panel title="Credits" label="Mock-only">
      {credits.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {credits.map((credit) => (
            <FileRow
              key={credit.id}
              title={credit.name}
              meta={`${credit.role} / ${credit.contact}`}
              status={credit.status}
              detail={credit.plannedSplit ? `${credit.plannedSplit}% planned split` : undefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No collaborators yet"
          detail="Credits are mocked until the backend domain is introduced."
        />
      )}
    </Panel>
  );
}

function AnalyticsTab({ songId }: { songId: string }) {
  const analytics = getAnalytics(songId);
  return analytics ? (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricBlock label="Views" value={formatNumber(analytics.views)} />
        <MetricBlock label="Likes" value={formatNumber(analytics.likes)} />
        <MetricBlock label="Comments" value={formatNumber(analytics.comments)} />
        <MetricBlock label="Watch time" value={`${formatNumber(analytics.watchTimeHours)}h`} />
      </div>
      <Panel title="View velocity" label="Mock analytics">
        <MiniBars values={analytics.velocity.map((item) => item.value)} />
      </Panel>
      <Panel title="Top content" label="Mock analytics" className="xl:col-span-2">
        <Timeline
          items={analytics.topContent.map((item) => ({
            id: item.title,
            title: item.title,
            meta: `${item.platform} / ${formatNumber(item.views)} views`,
          }))}
        />
      </Panel>
    </div>
  ) : (
    <EmptyState
      title="No analytics yet"
      detail="YouTube analytics is planned for a later integration phase."
    />
  );
}

export function CalendarPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Calendar" title="Campaign schedule" />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Month" label="Mock-only">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {Array.from({ length: 35 }, (_, index) => {
              const day = index + 1;
              const events = calendarEvents.filter((item) => new Date(item.date).getDate() === day);
              return (
                <div
                  key={day}
                  className="min-h-24 border border-border bg-background p-2 text-left"
                >
                  <p className="meta-tech">{day}</p>
                  {events.slice(0, 2).map((event) => (
                    <p key={event.id} className="mt-2 truncate text-[10px] text-foreground">
                      {event.kind}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Agenda" label="Mock-only">
          <Timeline
            items={calendarEvents.map((event) => ({
              id: event.id,
              title: event.title,
              meta: `${formatDate(event.date)} / ${event.kind}`,
              detail: event.song,
            }))}
          />
        </Panel>
      </div>
    </AppShell>
  );
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

function AssetCard({
  title,
  category,
  status,
  meta,
}: {
  title: string;
  category: string;
  status: string;
  meta: string;
}) {
  return (
    <article className="border border-border bg-panel p-3">
      <div className="aspect-video border border-border bg-background p-3">
        <div className="flex h-full items-end justify-between border border-border p-3">
          <span className="label-tech">{category}</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
        </div>
        <StatusBadge status={status} />
      </div>
    </article>
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
