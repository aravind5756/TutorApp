import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, test, vi } from "vitest";

import App from "./App";
import { getCurrentUser, login, logout, type AuthenticatedUser } from "./api/auth";
import { ApiError } from "./api/client";
import { AuthProvider } from "./auth/AuthContext";

vi.mock("./api/auth", () => ({ getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() }));

const tutor: AuthenticatedUser = {
  id: 1, email: "tutor@example.com", first_name: "Alex", last_name: "Reed", role: "tutor",
};

beforeEach(() => {
  vi.mocked(getCurrentUser).mockRejectedValue(new ApiError("Not authenticated.", 403));
  vi.mocked(login).mockResolvedValue(tutor);
  vi.mocked(logout).mockResolvedValue(undefined);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true, status: 200, json: async () => ({ status: "ok" }),
  }));
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

function renderApp() {
  return render(<AuthProvider><App /></AuthProvider>);
}

async function enterCredentials() {
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Sign in to TutorDesk" });
  await user.type(screen.getByLabelText("Email address"), tutor.email);
  await user.type(screen.getByLabelText("Password"), "test-password");
  return user;
}

test("does not flash the dashboard while the session is loading", () => {
  vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => {}));
  renderApp();
  expect(screen.getByRole("status")).toHaveTextContent("Checking your session");
  expect(screen.queryByText("Lessons this week")).not.toBeInTheDocument();
});

test("anonymous visitors see a validated login form, not tutor data", async () => {
  renderApp();
  await screen.findByRole("heading", { name: "Sign in to TutorDesk" });
  expect(screen.queryByText("Maya Thompson")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Email address")).toBeRequired();
  expect(screen.getByLabelText("Password")).toBeRequired();
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(login).not.toHaveBeenCalled();
});

test("shows submitting state then opens the dashboard after login", async () => {
  let finishLogin!: (user: AuthenticatedUser) => void;
  vi.mocked(login).mockReturnValue(new Promise((resolve) => { finishLogin = resolve; }));
  renderApp();
  const user = await enterCredentials();
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  expect(screen.getByLabelText("Password")).toBeDisabled();
  expect(login).toHaveBeenCalledTimes(1);
  expect(login).toHaveBeenCalledWith({ email: tutor.email, password: "test-password" });
  await act(async () => { finishLogin(tutor); });
  expect(await screen.findByRole("heading", { name: "Welcome back, Alex" })).toBeInTheDocument();
  expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
});

test("invalid credentials leave login visible with a helpful error", async () => {
  vi.mocked(login).mockRejectedValue(new ApiError("Invalid email or password.", 400));
  renderApp();
  const user = await enterCredentials();
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("email or password is incorrect");
  expect(screen.queryByText("Lessons this week")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
});

test("network failures do not expose the dashboard", async () => {
  vi.mocked(login).mockRejectedValue(new TypeError("Failed to fetch"));
  renderApp();
  const user = await enterCredentials();
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Check your connection");
  expect(screen.queryByText("Lessons this week")).not.toBeInTheDocument();
});

test("restores a tutor session and checks backend health", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(tutor);
  renderApp();
  expect(await screen.findByRole("heading", { name: "Welcome back, Alex" })).toBeInTheDocument();
  expect(await screen.findByText("System online")).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith("/api/v1/health/", expect.objectContaining({ credentials: "include" }));
});

test.each(["student", "guardian"] as const)("%s accounts cannot see the tutor dashboard", async (role) => {
  vi.mocked(getCurrentUser).mockResolvedValue({ ...tutor, role });
  renderApp();
  expect(await screen.findByRole("heading", { name: "Your portal is not available yet" })).toBeInTheDocument();
  expect(screen.queryByText("Lessons this week")).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
});

test("signing out removes the dashboard and returns to login", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(tutor);
  renderApp();
  await screen.findByRole("heading", { name: "Welcome back, Alex" });
  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByRole("heading", { name: "Sign in to TutorDesk" })).toBeInTheDocument();
  expect(logout).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Lessons this week")).not.toBeInTheDocument();
});

test("failed sign-out keeps the session visible and offers a retry", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(tutor);
  vi.mocked(logout).mockRejectedValue(new Error("Network error"));
  renderApp();
  await screen.findByRole("heading", { name: "Welcome back, Alex" });
  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not sign out");
  expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  expect(screen.getByText("Lessons this week")).toBeInTheDocument();
});

test("a tutor without a first name is identified by email", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ ...tutor, first_name: "", last_name: "" });
  renderApp();
  expect(await screen.findByRole("heading", { name: `Welcome back, ${tutor.email}` })).toBeInTheDocument();
});

test("the authenticated dashboard reports an unavailable health endpoint", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(tutor);
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Unavailable")));
  renderApp();
  expect(await screen.findByText("System unavailable")).toBeInTheDocument();
});
