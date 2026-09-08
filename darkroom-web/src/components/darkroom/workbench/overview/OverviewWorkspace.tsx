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
import { releaseReadinessApi } from "@/services/api/releaseReadiness";
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
  type ReleaseReadiness,
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
  analyticsSnapshotsQueryKey,
  audioAssetsQueryKey,
  contentItemsQueryKey,
  creditsQueryKey,
  normalizeId,
  releaseQueryKey,
  releaseReadinessQueryKey,
  visualAssetsQueryKey,
} from "../shared";
import { Info } from "../shared-ui";

function isSongStatus(value: string): value is SongStatus {
  return SONG_STATUSES.includes(value as SongStatus);
}

function statusLabel(status: string) {
  return isSongStatus(status) ? SONG_STATUS_LABELS[status] : status;
}

type WorkspaceTabValue = "audio" | "visuals" | "release" | "content" | "credits" | "analytics";

type AttentionItem = {
  title: string;
  detail: string;
  tab?: WorkspaceTabValue;
};

export function OverviewWorkspace({
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
  const readiness = useQuery({
    queryKey: releaseReadinessQueryKey(id),
    queryFn: () => releaseReadinessApi.getReadiness(id),
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
    readiness: readiness.data,
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

      {release.data && readiness.data ? (
        <Panel title="Release readiness" label="Checklist">
          <ReleaseReadinessSummary readiness={readiness.data} />
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

function ReleaseReadinessSummary({ readiness }: { readiness: ReleaseReadiness }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className="font-mono text-3xl font-semibold leading-none"
            role="status"
            aria-label={`${readiness.readyCount} of ${readiness.requiredCount} required release readiness items ready`}
          >
            {readiness.readyCount} / {readiness.requiredCount}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Required items ready</p>
        </div>
        <p className="font-mono text-sm text-muted-foreground">{readiness.percentage}%</p>
      </div>
      <div className="h-1 bg-background" aria-hidden>
        <div className="h-full bg-foreground" style={{ width: `${readiness.percentage}%` }} />
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
  readiness,
  contentItems,
}: {
  song: Song;
  audioAssets?: AudioAsset[];
  visualAssets?: VisualAsset[];
  release?: Release | null;
  readiness?: ReleaseReadiness;
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

  const nextReadinessItem = readiness?.items.find(
    (item) => item.isRequired && item.state === "Incomplete",
  );
  if (release && nextReadinessItem) {
    return {
      title: nextReadinessItem.label,
      detail: nextReadinessItem.reason,
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
