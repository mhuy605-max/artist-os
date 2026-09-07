import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api/client";
import { renderWithQueryClient } from "@/test/render";
import type { Credit, Song } from "@/types";

const {
  getMeMock,
  logoutMock,
  getSongMock,
  getAudioAssetsMock,
  getVisualAssetsMock,
  getReleaseMock,
  getChecklistMock,
  getContentItemsMock,
  getCreditsMock,
  createCreditMock,
  updateCreditMock,
  deleteCreditMock,
  getAnalyticsMock,
  getWorkspaceMock,
  provisionWorkspaceMock,
  getGoogleDriveStatusMock,
} = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  logoutMock: vi.fn(),
  getSongMock: vi.fn(),
  getAudioAssetsMock: vi.fn(),
  getVisualAssetsMock: vi.fn(),
  getReleaseMock: vi.fn(),
  getChecklistMock: vi.fn(),
  getContentItemsMock: vi.fn(),
  getCreditsMock: vi.fn(),
  createCreditMock: vi.fn(),
  updateCreditMock: vi.fn(),
  deleteCreditMock: vi.fn(),
  getAnalyticsMock: vi.fn(),
  getWorkspaceMock: vi.fn(),
  provisionWorkspaceMock: vi.fn(),
  getGoogleDriveStatusMock: vi.fn(),
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
    children: ReactNode;
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
  useLocation: () => ({ pathname: "/songs/3" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/services/api/auth", () => ({
  authQueryKey: ["auth", "me"],
  authApi: {
    me: getMeMock,
    logout: logoutMock,
  },
}));

vi.mock("@/services/api/songs", () => ({
  songsApi: {
    getSong: getSongMock,
  },
  isUsingFallbackData: () => false,
}));

vi.mock("@/services/api/audioAssets", () => ({
  audioAssetsApi: {
    getAudioAssets: getAudioAssetsMock,
    createAudioAsset: vi.fn(),
    updateAudioAsset: vi.fn(),
    deleteAudioAsset: vi.fn(),
    uploadAudioAssetFile: vi.fn(),
  },
}));

vi.mock("@/services/api/visualAssets", () => ({
  visualAssetsApi: {
    getVisualAssets: getVisualAssetsMock,
    createVisualAsset: vi.fn(),
    updateVisualAsset: vi.fn(),
    deleteVisualAsset: vi.fn(),
    uploadVisualAssetFile: vi.fn(),
  },
}));

vi.mock("@/services/api/releases", () => ({
  releasesApi: {
    getRelease: getReleaseMock,
    createRelease: vi.fn(),
    updateRelease: vi.fn(),
    deleteRelease: vi.fn(),
  },
}));

vi.mock("@/services/api/releaseChecklist", () => ({
  releaseChecklistApi: {
    getChecklist: getChecklistMock,
    getChecklistItem: vi.fn(),
    updateChecklistItem: vi.fn(),
  },
}));

vi.mock("@/services/api/contentItems", () => ({
  contentItemsApi: {
    getContentItems: getContentItemsMock,
    getContentItem: vi.fn(),
    createContentItem: vi.fn(),
    updateContentItem: vi.fn(),
    deleteContentItem: vi.fn(),
  },
}));

vi.mock("@/services/api/credits", () => ({
  creditsApi: {
    getCredits: getCreditsMock,
    createCredit: createCreditMock,
    updateCredit: updateCreditMock,
    deleteCredit: deleteCreditMock,
  },
}));

vi.mock("@/services/api/analytics", () => ({
  analyticsApi: {
    getAnalyticsSnapshots: getAnalyticsMock,
    createAnalyticsSnapshot: vi.fn(),
    updateAnalyticsSnapshot: vi.fn(),
    deleteAnalyticsSnapshot: vi.fn(),
  },
}));

vi.mock("@/services/api/driveWorkspace", () => ({
  driveWorkspaceQueryKey: (songId: string) => ["songs", songId, "drive-workspace"],
  isDriveWorkspaceDisconnectedError: () => false,
  driveWorkspaceApi: {
    getWorkspace: getWorkspaceMock,
    provisionWorkspace: provisionWorkspaceMock,
  },
}));

vi.mock("@/services/api/googleDrive", () => ({
  googleDriveConnectionQueryKey: ["google-drive", "connection"],
  googleDriveApi: {
    getStatus: getGoogleDriveStatusMock,
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
  openGoogleAuthorizationUrl: vi.fn(),
}));

vi.mock("@/services/api/calendar", () => ({
  calendarApi: {
    getCalendarEntries: vi.fn(),
  },
}));

vi.mock("@/services/api/dashboard", () => ({
  dashboardApi: {
    getDashboard: vi.fn(),
  },
}));

import { SongWorkspacePage } from "./Workbench";

const song: Song = {
  id: 3,
  title: "Credits Sheet Test Song",
  status: "ReleasePreparation",
  createdAt: "2026-09-01T10:00:00Z",
};

const credits: Credit[] = [
  {
    id: 301,
    songId: 3,
    contributorName: "Jane Doe",
    role: "Producer",
    contact: "jane.production@example.com",
    status: "Confirmed",
    splitPercentage: 25,
    notes: "Produced the main arrangement and approved the current credit metadata.",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
  {
    id: 302,
    songId: 3,
    contributorName: "Jane Doe",
    role: "Songwriter",
    contact: null,
    status: "Pending",
    splitPercentage: null,
    notes: null,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
  {
    id: 303,
    songId: 3,
    contributorName:
      "A Very Long Contributor Name That Should Wrap Across Multiple Lines Without Breaking The Credit Sheet",
    role: "RecordingEngineer",
    contact: "long-contact-value-without-natural-breaks-1234567890@example-studio.example",
    status: "Pending",
    splitPercentage: 0,
    notes:
      "Recorded vocals, guitars, and room tone. This note should stay compact in the row while still being available for editing.",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
  {
    id: 304,
    songId: 3,
    contributorName: "Max Master",
    role: "MasteringEngineer",
    contact: "max@example.com",
    status: "Confirmed",
    splitPercentage: 100,
    notes: null,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
];

async function renderCreditsWorkspace() {
  renderWithQueryClient(<SongWorkspacePage songId="3" />);
  await userEvent.click(await screen.findByRole("tab", { name: "credits" }));
}

describe("Credits workspace polish", () => {
  beforeEach(() => {
    getMeMock.mockReset();
    logoutMock.mockReset();
    getSongMock.mockReset();
    getAudioAssetsMock.mockReset();
    getVisualAssetsMock.mockReset();
    getReleaseMock.mockReset();
    getChecklistMock.mockReset();
    getContentItemsMock.mockReset();
    getCreditsMock.mockReset();
    createCreditMock.mockReset();
    updateCreditMock.mockReset();
    deleteCreditMock.mockReset();
    getAnalyticsMock.mockReset();
    getWorkspaceMock.mockReset();
    provisionWorkspaceMock.mockReset();
    getGoogleDriveStatusMock.mockReset();

    getMeMock.mockResolvedValue({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });
    getSongMock.mockResolvedValue(song);
    getAudioAssetsMock.mockResolvedValue([]);
    getVisualAssetsMock.mockResolvedValue([]);
    getReleaseMock.mockResolvedValue(null);
    getChecklistMock.mockResolvedValue([]);
    getContentItemsMock.mockResolvedValue([]);
    getCreditsMock.mockResolvedValue(credits);
    createCreditMock.mockResolvedValue(credits[0]);
    updateCreditMock.mockResolvedValue(credits[0]);
    deleteCreditMock.mockResolvedValue(undefined);
    getAnalyticsMock.mockResolvedValue([]);
    getWorkspaceMock.mockResolvedValue({ isProvisioned: false, folders: {} });
    provisionWorkspaceMock.mockResolvedValue(undefined);
    getGoogleDriveStatusMock.mockResolvedValue({ connected: false, status: null });
  });

  it("shows the credits contributors hierarchy", async () => {
    await renderCreditsWorkspace();

    expect(await screen.findByText("CREDITS / CONTRIBUTORS")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CREDITS" })).toBeInTheDocument();
    expect(screen.getByText("SUMMARY")).toBeInTheDocument();
    expect(screen.getByText("CREDIT COVERAGE / PLANNED SPLITS")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contributors" })).toBeInTheDocument();
    expect(screen.queryByText("Real backend data")).not.toBeInTheDocument();
  });

  it("derives summary counts and planned split coverage from real credit records", async () => {
    await renderCreditsWorkspace();

    expect(await screen.findByText("TOTAL CREDITS")).toBeInTheDocument();
    expect(screen.getAllByText("CONTRIBUTORS").length).toBeGreaterThan(0);
    expect(screen.getByText("CONFIRMED")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByText("125% recorded")).toBeInTheDocument();
    expect(
      screen.getByText("Sum of currently recorded planned split metadata across 3 credits."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Missing splits are allowed. Totals are informational only."),
    ).toBeInTheDocument();
  });

  it("presents contributors, roles, statuses, contact, planned splits, and notes for scanning", async () => {
    await renderCreditsWorkspace();

    expect(await screen.findAllByText("Jane Doe")).toHaveLength(2);
    expect(screen.getByText("Producer")).toBeInTheDocument();
    expect(screen.getByText("Songwriter")).toBeInTheDocument();
    expect(screen.getByText("Recording Engineer")).toBeInTheDocument();
    expect(screen.getByText("Mastering Engineer")).toBeInTheDocument();
    expect(screen.getAllByText("Confirmed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getByText("25% planned")).toBeInTheDocument();
    expect(screen.getByText("0% planned")).toBeInTheDocument();
    expect(screen.getByText("100% planned")).toBeInTheDocument();
    expect(screen.getByText("Split not recorded")).toBeInTheDocument();
    expect(screen.getByText("Contact not recorded")).toBeInTheDocument();
    expect(screen.getByText(credits[2].contributorName)).toBeInTheDocument();
    expect(screen.getAllByText(credits[2].contact!).length).toBeGreaterThan(0);
    expect(screen.getByText(credits[0].notes!)).toBeInTheDocument();
  });

  it("shows one focused empty credits state", async () => {
    getCreditsMock.mockResolvedValue([]);

    await renderCreditsWorkspace();

    expect(await screen.findByText("NO CREDITS ADDED")).toBeInTheDocument();
    expect(screen.getByText("Build the contributor list for this Song.")).toBeInTheDocument();
    expect(screen.queryByText("Artist / Producer / Songwriter")).not.toBeInTheDocument();
  });

  it("creates credit metadata with supported fields only", async () => {
    getCreditsMock.mockResolvedValue([]);
    const user = userEvent.setup();

    await renderCreditsWorkspace();
    await user.click((await screen.findAllByRole("button", { name: /add credit/i }))[0]);
    await user.type(screen.getByLabelText(/contributor name/i), "New Producer");
    await user.type(screen.getByLabelText(/^contact$/i), "studio handle");
    await user.type(screen.getByLabelText(/planned split/i), "12.5");
    await user.type(screen.getByLabelText(/^notes$/i), "Needs confirmation after mix review.");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createCreditMock).toHaveBeenCalledWith("3", {
        contributorName: "New Producer",
        role: "Artist",
        contact: "studio handle",
        status: "Pending",
        splitPercentage: 12.5,
        notes: "Needs confirmation after mix review.",
      });
    });
  });

  it("edits credit metadata without adding account, invite, contract, or payment controls", async () => {
    const user = userEvent.setup();

    await renderCreditsWorkspace();
    const producerRow = screen.getAllByText("jane.production@example.com")[0].closest("article");
    expect(producerRow).not.toBeNull();
    await user.click(within(producerRow!).getByRole("button", { name: /^edit$/i }));
    const name = screen.getByLabelText(/contributor name/i);
    await user.clear(name);
    await user.type(name, "Jane Doe Updated");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updateCreditMock).toHaveBeenCalledWith("3", "301", {
        contributorName: "Jane Doe Updated",
        role: "Producer",
        contact: "jane.production@example.com",
        status: "Confirmed",
        splitPercentage: 25,
        notes: "Produced the main arrangement and approved the current credit metadata.",
      });
    });

    expect(screen.queryByText(/invite contributor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/artist os user/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/contract/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/signature/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/payment details/i)).not.toBeInTheDocument();
  });

  it("validates contributor and split bounds before saving", async () => {
    getCreditsMock.mockResolvedValue([]);
    const user = userEvent.setup();

    await renderCreditsWorkspace();
    await user.click((await screen.findAllByRole("button", { name: /add credit/i }))[0]);
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Contributor name is required.")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/contributor name/i), "Out of Range");
    await user.type(screen.getByLabelText(/planned split/i), "101");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Planned split must be between 0 and 100.")).toBeInTheDocument();
    expect(createCreditMock).not.toHaveBeenCalled();
  });

  it("explains delete behavior as Song credit metadata only", async () => {
    const user = userEvent.setup();

    await renderCreditsWorkspace();
    const producerRow = screen.getAllByText("jane.production@example.com")[0].closest("article");
    expect(producerRow).not.toBeNull();
    await user.click(within(producerRow!).getByRole("button", { name: /^delete$/i }));

    expect(screen.getByRole("heading", { name: "Remove credit?" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This removes only this contributor credit metadata from this Song. Artist OS users, team access, and external distributor records are not affected.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(deleteCreditMock).toHaveBeenCalledWith("3", "301"));
  });

  it("shows loading and API error states with retry", async () => {
    getCreditsMock.mockReturnValue(new Promise(() => undefined));
    const loading = renderWithQueryClient(<SongWorkspacePage songId="3" />);
    await userEvent.click(await screen.findByRole("tab", { name: "credits" }));

    expect(await screen.findByLabelText("Loading credits contributors")).toBeInTheDocument();
    loading.unmount();

    getCreditsMock.mockRejectedValue(new ApiError("Credits unavailable", 500));
    await renderCreditsWorkspace();

    expect(
      await screen.findByText("We couldn't load contributor credits from Artist OS."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("does not render unsupported invite, account, payment, royalty, or legal workflow language", async () => {
    await renderCreditsWorkspace();

    expect(await screen.findByText("CREDITS / CONTRIBUTORS")).toBeInTheDocument();
    expect(screen.queryByText(/invited/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/send email/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/contributor account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/team member/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/royalty/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/payout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/legal ownership/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/publishing share/i)).not.toBeInTheDocument();
  });
});
