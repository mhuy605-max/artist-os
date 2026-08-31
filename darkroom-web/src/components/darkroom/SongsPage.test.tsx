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

    expect(await screen.findAllByText("Glass Radio")).toHaveLength(2);
    expect(screen.getAllByText("Midnight Signal")).toHaveLength(2);
    expect(screen.getByText("Release Preparation")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
  });

  it("renders an intentional empty state when there are no Songs", async () => {
    getSongsMock.mockResolvedValueOnce([]);

    renderWithQueryClient(<SongsPage />);

    expect(await screen.findByText("No songs yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create the first song to begin building the workspace."),
    ).toBeInTheDocument();
  });

  it("renders an error state when the Song API fails", async () => {
    getSongsMock.mockRejectedValueOnce(new Error("Song API failed"));

    renderWithQueryClient(<SongsPage />);

    expect(await screen.findByText("This area did not load")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
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

    await userEvent.click(await screen.findByRole("button", { name: /create song/i }));
    const dialog = await screen.findByRole("dialog", { name: /create song/i });

    await userEvent.type(within(dialog).getByLabelText("Title"), "  North Room  ");
    await userEvent.click(within(dialog).getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Recording" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(createSongMock).toHaveBeenCalled();
    });
    expect(createSongMock.mock.calls[0]?.[0]).toEqual({
      title: "North Room",
      status: "Recording",
    } satisfies SongPayload);
  });
});
