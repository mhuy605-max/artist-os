import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "@/test/render";

const {
  getMeMock,
  logoutMock,
  getStatusMock,
  connectMock,
  disconnectMock,
  openGoogleAuthorizationUrlMock,
} = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  logoutMock: vi.fn(),
  getStatusMock: vi.fn(),
  connectMock: vi.fn(),
  disconnectMock: vi.fn(),
  openGoogleAuthorizationUrlMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useLocation: () => ({ pathname: "/settings" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/services/api/auth", () => ({
  authQueryKey: ["auth", "me"],
  authApi: {
    me: getMeMock,
    logout: logoutMock,
  },
}));

vi.mock("@/services/api/googleDrive", () => ({
  googleDriveConnectionQueryKey: ["google-drive", "connection"],
  googleDriveApi: {
    getStatus: getStatusMock,
    connect: connectMock,
    disconnect: disconnectMock,
  },
  openGoogleAuthorizationUrl: openGoogleAuthorizationUrlMock,
}));

import { SettingsPage } from "./Workbench";

describe("SettingsPage Google Drive connection", () => {
  beforeEach(() => {
    getMeMock.mockReset();
    logoutMock.mockReset();
    getStatusMock.mockReset();
    connectMock.mockReset();
    disconnectMock.mockReset();
    openGoogleAuthorizationUrlMock.mockReset();
    getMeMock.mockResolvedValue({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });
  });

  it("renders disconnected state", async () => {
    getStatusMock.mockResolvedValueOnce({ connected: false });

    renderWithQueryClient(<SettingsPage />);

    expect(await screen.findByText("Google Drive")).toBeInTheDocument();
    expect(screen.getAllByText("Not connected")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument();
  });

  it("connect action requests authorization URL and starts navigation", async () => {
    getStatusMock.mockResolvedValueOnce({ connected: false });
    connectMock.mockResolvedValueOnce({
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=protected",
    });

    renderWithQueryClient(<SettingsPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Connect" }));

    await waitFor(() => {
      expect(connectMock).toHaveBeenCalled();
      expect(openGoogleAuthorizationUrlMock).toHaveBeenCalledWith(
        "https://accounts.google.com/o/oauth2/v2/auth?state=protected",
      );
    });
  });

  it("renders connected account metadata without token material", async () => {
    getStatusMock.mockResolvedValueOnce({
      connected: true,
      email: "artist.google@example.com",
      status: "Connected",
      connectedAt: "2026-08-31T10:00:00Z",
    });

    renderWithQueryClient(<SettingsPage />);

    expect(await screen.findByText("artist.google@example.com")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeInTheDocument();
    expect(screen.queryByText(/refresh-token/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/access-token/i)).not.toBeInTheDocument();
  });

  it("disconnect action calls mutation and returns to disconnected state", async () => {
    getStatusMock
      .mockResolvedValueOnce({
        connected: true,
        email: "artist.google@example.com",
        status: "Connected",
        connectedAt: "2026-08-31T10:00:00Z",
      })
      .mockResolvedValueOnce({ connected: false });
    disconnectMock.mockResolvedValueOnce({ disconnected: true });

    renderWithQueryClient(<SettingsPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Disconnect" }));

    await waitFor(() => {
      expect(disconnectMock).toHaveBeenCalled();
    });
    expect(await screen.findByRole("button", { name: "Connect" })).toBeInTheDocument();
  });

  it("renders ReauthRequired state as reconnect", async () => {
    getStatusMock.mockResolvedValueOnce({
      connected: false,
      email: "artist.google@example.com",
      status: "ReauthRequired",
    });

    renderWithQueryClient(<SettingsPage />);

    expect(await screen.findByText("Connection needs attention")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconnect" })).toBeInTheDocument();
  });

  it("renders API error state", async () => {
    getStatusMock.mockRejectedValueOnce(new Error("Status failed"));

    renderWithQueryClient(<SettingsPage />);

    expect(await screen.findByText("Google Drive status did not load.")).toBeInTheDocument();
  });
});
