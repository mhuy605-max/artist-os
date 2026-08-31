import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "@/test/render";

const { loginMock, registerMock, getMeMock, logoutMock, navigateMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  registerMock: vi.fn(),
  getMeMock: vi.fn(),
  logoutMock: vi.fn(),
  navigateMock: vi.fn(),
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
  useLocation: () => ({ pathname: "/dashboard" }),
  useNavigate: () => navigateMock,
}));

vi.mock("@/services/api/auth", () => ({
  authQueryKey: ["auth", "me"],
  authApi: {
    login: loginMock,
    register: registerMock,
    me: getMeMock,
    logout: logoutMock,
  },
}));

import { AppShell } from "./AppShell";
import { LoginPage } from "./Workbench";
import { unauthorizedEventName } from "@/services/api/client";

describe("auth flow", () => {
  beforeEach(() => {
    loginMock.mockReset();
    registerMock.mockReset();
    getMeMock.mockReset();
    logoutMock.mockReset();
    navigateMock.mockReset();
  });

  it("login success calls the auth service and navigates to the dashboard", async () => {
    loginMock.mockResolvedValueOnce({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });

    renderWithQueryClient(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Email"), "artist@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "artist@example.com",
        password: "password123",
      });
    });
    expect(navigateMock).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("invalid login errors render without exposing password data", async () => {
    loginMock.mockRejectedValueOnce(new Error("Invalid email or password."));

    renderWithQueryClient(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Email"), "artist@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(screen.queryByText("wrong-password")).not.toBeInTheDocument();
  });

  it("registration calls the auth service with display name", async () => {
    registerMock.mockResolvedValueOnce({
      id: 2,
      email: "new@example.com",
      displayName: "New Artist",
    });

    renderWithQueryClient(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
    await userEvent.type(screen.getByLabelText("Display name"), "New Artist");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
        displayName: "New Artist",
      });
    });
  });

  it("authenticated session renders protected app content", async () => {
    getMeMock.mockResolvedValueOnce({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });

    renderWithQueryClient(<AppShell>Protected dashboard</AppShell>);

    expect(await screen.findByText("Protected dashboard")).toBeInTheDocument();
    expect(screen.getByText("artist@example.com")).toBeInTheDocument();
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument();
  });

  it("unauthenticated session redirects protected app routes to login", async () => {
    getMeMock.mockRejectedValueOnce(new Error("Unauthorized"));

    renderWithQueryClient(<AppShell>Protected dashboard</AppShell>);

    const redirect = await screen.findByTestId("navigate");
    expect(redirect).toHaveAttribute("data-to", "/login");
    expect(screen.queryByText("Protected dashboard")).not.toBeInTheDocument();
  });

  it("logout action calls the auth service", async () => {
    getMeMock.mockResolvedValueOnce({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });
    logoutMock.mockResolvedValueOnce(undefined);

    renderWithQueryClient(<AppShell>Protected dashboard</AppShell>);

    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
    });
  });

  it("global unauthorized events redirect protected routes to login", async () => {
    getMeMock.mockResolvedValueOnce({
      id: 1,
      email: "artist@example.com",
      displayName: "Artist",
    });

    renderWithQueryClient(<AppShell>Protected dashboard</AppShell>);

    expect(await screen.findByText("Protected dashboard")).toBeInTheDocument();

    window.dispatchEvent(new Event(unauthorizedEventName));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: "/login" });
    });
  });
});
