import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "@/test/render";
import type { DashboardResponse } from "@/types";

const { getDashboardMock } = vi.hoisted(() => ({
  getDashboardMock: vi.fn(),
}));

const { getMeMock, logoutMock } = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  logoutMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    className,
  }: {
    to: string;
    params?: Record<string, string>;
    children: React.ReactNode;
    className?: string;
  }) => {
    const href = params?.["songId"] ? to.replace("$songId", params["songId"]) : to;
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/dashboard" }),
}));

vi.mock("@/services/api/auth", () => ({
  authQueryKey: ["auth", "me"],
  authApi: {
    me: getMeMock,
    logout: logoutMock,
  },
}));

vi.mock("@/services/api/dashboard", () => ({
  dashboardApi: {
    getDashboard: getDashboardMock,
  },
}));

import { DashboardPage } from "./Workbench";

function dashboardFixture(): DashboardResponse {
  return {
    summary: {
      totalSongs: 12,
      activeSongs: 9,
      upcomingReleases: 2,
      scheduledContent: 4,
    },
    pipeline: [
      { status: "Idea", label: "Idea", count: 1 },
      { status: "Demo", label: "Demo", count: 2 },
      { status: "Recording", label: "Recording", count: 1 },
      { status: "Mixing", label: "Mixing", count: 2 },
      { status: "Mastering", label: "Mastering", count: 1 },
      { status: "ReleasePreparation", label: "Release Preparation", count: 2 },
      { status: "ContentCampaign", label: "Content Campaign", count: 1 },
      { status: "Released", label: "Released", count: 2 },
      { status: "Analytics", label: "Analytics", count: 0 },
    ],
    upcoming: [
      {
        sourceType: "Release",
        sourceId: 20,
        songId: 7,
        songTitle: "Neon Control",
        eventType: "ReleaseDate",
        title: "Neon Control release",
        date: "2026-09-12",
        status: "Scheduled",
        platform: null,
        navigationTarget: "/songs/7",
      },
    ],
    releaseReadiness: [
      {
        releaseId: 20,
        songId: 7,
        songTitle: "Neon Control",
        releaseDate: "2026-09-12",
        status: "Preparing",
        completedItems: 4,
        totalItems: 7,
        readinessPercentage: 57,
        navigationTarget: "/songs/7",
      },
    ],
    analyticsOverview: [
      {
        songId: 7,
        songTitle: "Neon Control",
        platform: "YouTube",
        snapshotDate: "2026-08-29",
        views: 24000,
        likes: 1200,
        comments: 180,
        watchTimeMinutes: 4500,
        subscribersGained: 64,
        navigationTarget: "/songs/7",
      },
    ],
    recentActivity: [
      {
        type: "ReleaseUpdated",
        songId: 7,
        songTitle: "Neon Control",
        description: "Release plan updated",
        occurredAt: "2026-08-30T08:00:00Z",
        navigationTarget: "/songs/7",
      },
    ],
  };
}

function emptyDashboardFixture(): DashboardResponse {
  return {
    summary: {
      totalSongs: 0,
      activeSongs: 0,
      upcomingReleases: 0,
      scheduledContent: 0,
    },
    pipeline: [
      { status: "Idea", label: "Idea", count: 0 },
      { status: "Demo", label: "Demo", count: 0 },
      { status: "Recording", label: "Recording", count: 0 },
      { status: "Mixing", label: "Mixing", count: 0 },
      { status: "Mastering", label: "Mastering", count: 0 },
      { status: "ReleasePreparation", label: "Release Preparation", count: 0 },
      { status: "ContentCampaign", label: "Content Campaign", count: 0 },
      { status: "Released", label: "Released", count: 0 },
      { status: "Analytics", label: "Analytics", count: 0 },
    ],
    upcoming: [],
    releaseReadiness: [],
    analyticsOverview: [],
    recentActivity: [],
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    getDashboardMock.mockReset();
    getMeMock.mockReset();
    logoutMock.mockReset();
    getMeMock.mockResolvedValue({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });
  });

  it("renders real aggregate dashboard values", async () => {
    getDashboardMock.mockResolvedValueOnce(dashboardFixture());

    renderWithQueryClient(<DashboardPage />);

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Upcoming releases")).toBeInTheDocument();
    expect(screen.getByText("Scheduled content")).toBeInTheDocument();
    expect(screen.getAllByText("Release Preparation").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Neon Control release")).toBeInTheDocument();
    expect(screen.getAllByText("Neon Control")[0]).toBeInTheDocument();
    expect(screen.getByText("4 / 7 complete")).toBeInTheDocument();
    expect(screen.getByText("24K views")).toBeInTheDocument();
    expect(screen.getByText("Release plan updated")).toBeInTheDocument();
  });

  it("renders intentional empty states for an empty dashboard", async () => {
    getDashboardMock.mockResolvedValueOnce(emptyDashboardFixture());

    renderWithQueryClient(<DashboardPage />);

    expect(await screen.findByText("No songs yet")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText("No upcoming dates")).toBeInTheDocument();
    expect(screen.getByText("No release plans")).toBeInTheDocument();
    expect(screen.getByText("No analytics snapshots")).toBeInTheDocument();
    expect(screen.getByText("No recent activity")).toBeInTheDocument();
  });

  it("renders loading state while the dashboard request is pending", async () => {
    getDashboardMock.mockReturnValueOnce(new Promise(() => {}));

    renderWithQueryClient(<DashboardPage />);

    expect(await screen.findByText("Loading dashboard")).toBeInTheDocument();
  });

  it("renders an error state and can retry the dashboard request", async () => {
    getDashboardMock.mockRejectedValueOnce(new Error("dashboard unavailable"));

    renderWithQueryClient(<DashboardPage />);

    expect(await screen.findByText("This area did not load")).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "Retry" });

    getDashboardMock.mockResolvedValueOnce(emptyDashboardFixture());
    await userEvent.click(retry);

    expect(await screen.findByText("No songs yet")).toBeInTheDocument();
    expect(getDashboardMock).toHaveBeenCalledTimes(2);
  });

  it("links dashboard rows back to the Song workspace", async () => {
    getDashboardMock.mockResolvedValueOnce(dashboardFixture());

    renderWithQueryClient(<DashboardPage />);

    const upcomingPanel = await screen.findByText("Upcoming work");
    const panel = upcomingPanel.closest("section");

    expect(panel).not.toBeNull();
    expect(within(panel!).getByRole("link", { name: /Neon Control release/i })).toHaveAttribute(
      "href",
      "/songs/7",
    );
  });
});
