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

import { contentItemsQueryKey, normalizeId } from "../shared";

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

export function ContentWorkspace({ songId }: { songId: string }) {
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
