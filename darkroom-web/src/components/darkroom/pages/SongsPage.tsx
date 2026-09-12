import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus, Search, Trash2 } from "lucide-react";

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
  DialogFooter,
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
import { isUsingFallbackData, songsApi } from "@/services/api/songs";
import type { Song, SongCreateRequest, SongStatus, SongUpdateRequest } from "@/types";
import { SONG_STATUS_LABELS, SONG_STATUSES } from "@/types";
import { cn } from "@/lib/utils";

import { AppShell } from "../AppShell";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, formatDate } from "../Primitives";
import { StatusBadge } from "../StatusBadge";
import { deriveSongAccess, normalizeId, songRoleLabel } from "../workbench/shared";
import { songsQueryKey } from "./page-query-keys";

function useSongs() {
  return useQuery({
    queryKey: songsQueryKey,
    queryFn: songsApi.getSongs,
  });
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
