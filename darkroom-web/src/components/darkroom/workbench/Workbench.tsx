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

import { AnalyticsWorkspace } from "./analytics/AnalyticsWorkspace";
import { AudioWorkspace } from "./audio/AudioWorkspace";
import { ContentWorkspace } from "./content/ContentWorkspace";
import { CreditsWorkspace } from "./credits/CreditsWorkspace";
import { OverviewWorkspace } from "./overview/OverviewWorkspace";
import { ReleaseWorkspace } from "./release/ReleaseWorkspace";
import { VisualsWorkspace } from "./visuals/VisualsWorkspace";
import { normalizeId } from "./shared";

function FallbackNotice() {
  return isUsingFallbackData() ? (
    <div className="mb-4 border border-border-strong bg-panel p-3 text-sm text-muted-foreground">
      Catalog preview mode: the local workspace is unavailable, so changes stay in this browser
      session.
    </div>
  ) : null;
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
          <OverviewWorkspace song={song} onNavigateTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="audio">
          <AudioWorkspace songId={id} />
        </TabsContent>
        <TabsContent value="visuals">
          <VisualsWorkspace songId={id} />
        </TabsContent>
        <TabsContent value="release">
          <ReleaseWorkspace songId={id} />
        </TabsContent>
        <TabsContent value="content">
          <ContentWorkspace songId={id} />
        </TabsContent>
        <TabsContent value="credits">
          <CreditsWorkspace songId={id} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsWorkspace songId={id} />
        </TabsContent>
      </Tabs>
    </>
  );
}
