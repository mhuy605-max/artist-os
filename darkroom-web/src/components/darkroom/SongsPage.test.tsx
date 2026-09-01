import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "@/test/render";
import type { Song, SongPayload } from "@/types";

const { getSongsMock, createSongMock, updateSongMock, deleteSongMock, isUsingFallbackDataMock } =
  vi.hoisted(() => ({
    getSongsMock: vi.fn(),
    createSongMock: vi.fn(),
    updateSongMock: vi.fn(),
    deleteSongMock: vi.fn(),
    isUsingFallbackDataMock: vi.fn(),
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
  useLocation: () => ({ pathname: "/songs" }),
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
    getSongs: getSongsMock,
    createSong: createSongMock,
    updateSong: updateSongMock,
    deleteSong: deleteSongMock,
  },
  isUsingFallbackData: isUsingFallbackDataMock,
}));

import { SongsPage } from "./Workbench";

const songsFixture: Song[] = [
  {
    id: 1,
    title: "Midnight Signal",
    status: "Demo",
    createdAt: "2026-08-28T10:00:00Z",
  },
  {
    id: 2,
    title: "Glass Radio",
    status: "ReleasePreparation",
    createdAt: "2026-08-29T10:00:00Z",
  },
  {
    id: 4,
    title: "A Very Long Working Title For A Late Night Master Session That Still Needs Room",
    status: "Released",
    createdAt: "2026-08-27T10:00:00Z",
  },
];

describe("SongsPage", () => {
  beforeEach(() => {
    getSongsMock.mockReset();
    createSongMock.mockReset();
    updateSongMock.mockReset();
    deleteSongMock.mockReset();
    isUsingFallbackDataMock.mockReturnValue(false);
    getMeMock.mockReset();
    logoutMock.mockReset();
    getMeMock.mockResolvedValue({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });
  });

  it("renders returned Songs with title and status", async () => {
    getSongsMock.mockResolvedValueOnce(songsFixture);

    renderWithQueryClient(<SongsPage />);

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText("Songs / Catalog")).toBeInTheDocument();
    expect(screen.getByText("Your active music workspace.")).toBeInTheDocument();
    expect(screen.getByText("Total projects")).toBeInTheDocument();
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getAllByText("Released").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Glass Radio")).toHaveLength(1);
    expect(screen.getAllByText("Midnight Signal")).toHaveLength(1);
    expect(
      screen.getByText(
        "A Very Long Working Title For A Late Night Master Session That Still Needs Room",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Release Preparation")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
    expect(screen.getByText("Aug 29, 2026")).toBeInTheDocument();
    expect(screen.queryByText(/BPM/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/people/i)).not.toBeInTheDocument();
  });

  it("renders an intentional empty state when there are no Songs", async () => {
    getSongsMock.mockResolvedValueOnce([]);

    renderWithQueryClient(<SongsPage />);

    expect(await screen.findByText("No projects yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create your first Song to begin building its audio, visual, release, content, credit, and analytics workspace.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /new song/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders a layout-preserving loading state", async () => {
    getSongsMock.mockReturnValueOnce(new Promise(() => {}));

    renderWithQueryClient(<SongsPage />);

    expect(await screen.findByLabelText("Loading projects")).toBeInTheDocument();
  });

  it("renders an error state when the Song API fails", async () => {
    getSongsMock.mockRejectedValueOnce(new Error("Song API failed"));

    renderWithQueryClient(<SongsPage />);

    expect(await screen.findByText("Projects unavailable")).toBeInTheDocument();
    expect(screen.getByText("We couldn't load your catalog.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("can retry after the Song API fails", async () => {
    getSongsMock.mockRejectedValueOnce(new Error("Song API failed"));

    renderWithQueryClient(<SongsPage />);

    const retry = await screen.findByRole("button", { name: "Retry" });
    getSongsMock.mockResolvedValueOnce(songsFixture);
    await userEvent.click(retry);

    expect(await screen.findByText("Glass Radio")).toBeInTheDocument();
    expect(getSongsMock).toHaveBeenCalledTimes(2);
  });

  it("filters the loaded portfolio by search and lifecycle", async () => {
    getSongsMock.mockResolvedValueOnce(songsFixture);

    renderWithQueryClient(<SongsPage />);

    await screen.findByText("Glass Radio");
    await userEvent.type(screen.getByLabelText("Search projects"), "glass");

    expect(screen.getByText("Glass Radio")).toBeInTheDocument();
    expect(screen.queryByText("Midnight Signal")).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Search projects"));
    await userEvent.click(screen.getByLabelText("Filter by lifecycle"));
    await userEvent.click(await screen.findByRole("option", { name: "Released" }));

    expect(
      screen.getByText(
        "A Very Long Working Title For A Late Night Master Session That Still Needs Room",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Glass Radio")).not.toBeInTheDocument();
  });

  it("links project rows to the Song workspace", async () => {
    getSongsMock.mockResolvedValueOnce(songsFixture);

    renderWithQueryClient(<SongsPage />);

    const projectLink = await screen.findByRole("link", { name: /Glass Radio/i });
    expect(projectLink).toHaveAttribute("href", "/songs/2");
  });

  it("calls createSong with the entered title and status", async () => {
    const createdSong: Song = {
      id: 3,
      title: "North Room",
      status: "Recording",
      createdAt: "2026-08-30T10:00:00Z",
    };
    getSongsMock.mockResolvedValue([]);
    createSongMock.mockResolvedValueOnce(createdSong);

    renderWithQueryClient(<SongsPage />);

    await userEvent.click(await screen.findByRole("button", { name: /new song/i }));
    const dialog = await screen.findByRole("dialog", { name: /new song/i });

    await userEvent.type(within(dialog).getByLabelText("Project title"), "  North Room  ");
    await userEvent.click(within(dialog).getByLabelText("Lifecycle"));
    await userEvent.click(await screen.findByRole("option", { name: "Recording" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Create song" }));

    await waitFor(() => {
      expect(createSongMock).toHaveBeenCalled();
    });
    expect(createSongMock.mock.calls[0]?.[0]).toEqual({
      title: "North Room",
      status: "Recording",
    } satisfies SongPayload);
  });

  it("shows create validation and submit failure without sending invalid titles", async () => {
    getSongsMock.mockResolvedValue([]);
    createSongMock.mockRejectedValueOnce(new Error("Unable to save project."));

    renderWithQueryClient(<SongsPage />);

    await userEvent.click(await screen.findByRole("button", { name: /new song/i }));
    const dialog = await screen.findByRole("dialog", { name: /new song/i });

    await userEvent.click(within(dialog).getByRole("button", { name: "Create song" }));

    expect(await within(dialog).findByText("Title is required.")).toBeInTheDocument();
    expect(createSongMock).not.toHaveBeenCalled();

    await userEvent.type(within(dialog).getByLabelText("Project title"), "Failed Save");
    await userEvent.click(within(dialog).getByRole("button", { name: "Create song" }));

    expect(await within(dialog).findByText("Unable to save project.")).toBeInTheDocument();
  });
});
