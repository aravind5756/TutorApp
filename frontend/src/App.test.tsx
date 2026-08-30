import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import App from "./App";


afterEach(() => {
  vi.unstubAllGlobals();
});


test("renders the dashboard and reports a healthy backend", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" }),
    }),
  );

  render(<App />);

  expect(
    screen.getByRole("heading", { name: /good morning, aravind/i }),
  ).toBeInTheDocument();
  expect(screen.getByText("Lessons this week")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /today’s lessons/i })).toBeInTheDocument();
  expect(screen.getAllByText("Maya Thompson")).not.toHaveLength(0);

  await waitFor(() => {
    expect(screen.getByText("System online")).toBeInTheDocument();
  });
});


test("reports when the backend cannot be reached", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Unavailable")));

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText("System unavailable")).toBeInTheDocument();
  });
});
