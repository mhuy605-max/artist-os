import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { dashboardApi } from "@/services/api/dashboard";
import {
  ANALYTICS_PLATFORM_LABELS,
  type AnalyticsPlatform,
  type DashboardActivityItem,
  type DashboardAnalyticsItem,
  type DashboardOverview,
  type DashboardPipelineItem,
  type DashboardSongSummary,
  type DashboardUpcomingItem,
} from "@/types";

import { AppShell } from "../AppShell";
import {
  EmptyState,
  ErrorState,
  MetricBlock,
  PageHeader,
  Panel,
  formatDate,
  formatNumber,
} from "../Primitives";
import { StatusBadge } from "../StatusBadge";
import { dashboardQueryKey } from "./page-query-keys";
import { normalizeId } from "../workbench/shared";

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
