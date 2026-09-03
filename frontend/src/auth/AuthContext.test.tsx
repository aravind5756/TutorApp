import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, test, vi } from "vitest";

import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";


function AuthState() {
  const { status, user } = useAuth();
  return <p>{user ? `${status}: ${user.email}` : status}</p>;
}

function response(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});


test("restores an existing authenticated session", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      response({
        id: 1,
        email: "tutor@example.com",
        first_name: "Alex",
        last_name: "Reed",
        role: "tutor",
      }),
    ),
  );

  render(
    <AuthProvider>
      <AuthState />
    </AuthProvider>,
  );

  expect(screen.getByText("loading")).toBeInTheDocument();
  await waitFor(() => {
    expect(
      screen.getByText("authenticated: tutor@example.com"),
    ).toBeInTheDocument();
  });
});


test("settles as unauthenticated when no session exists", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(response({ detail: "Not authenticated." }, 403)),
  );

  render(
    <AuthProvider>
      <AuthState />
    </AuthProvider>,
  );

  await waitFor(() => {
    expect(screen.getByText("unauthenticated")).toBeInTheDocument();
  });
});
