import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { getBookings, type BookingListResponse } from "../api/bookings";
import { BookingsPage } from "./BookingsPage";

vi.mock("../api/bookings", () => ({ getBookings: vi.fn() }));

const firstPage: BookingListResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      student: {
        id: 4,
        first_name: "Maya",
        last_name: "Thompson",
        year_group: "Year 11",
      },
      starts_at: "2026-09-10T12:00:00",
      ends_at: "2026-09-10T13:00:00",
      status: "confirmed",
      format: "online",
      location: "",
    },
    {
      id: 2,
      student: {
        id: 8,
        first_name: "Alex",
        last_name: "Reed",
        year_group: "Year 9",
      },
      starts_at: "2026-09-11T15:30:00",
      ends_at: "2026-09-11T16:30:00",
      status: "requested",
      format: "in_person",
      location: "Central Library",
    },
  ],
};

beforeEach(() => {
  vi.mocked(getBookings).mockResolvedValue(firstPage);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

test("shows a loading state before bookings arrive", () => {
  vi.mocked(getBookings).mockReturnValue(new Promise(() => {}));
  render(<BookingsPage />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading bookings");
});

test("shows booking students, times, statuses and locations", async () => {
  render(<BookingsPage />);

  expect(await screen.findByText("Maya Thompson")).toBeInTheDocument();
  expect(screen.getByText("Alex Reed")).toBeInTheDocument();
  expect(screen.getByText("12:00–13:00")).toBeInTheDocument();
  expect(screen.getByText("Online")).toBeInTheDocument();
  expect(screen.getByText("Central Library")).toBeInTheDocument();
  expect(screen.getByText("confirmed")).toBeInTheDocument();
  expect(screen.getByText("Showing 2 bookings")).toBeInTheDocument();
});

test("shows an empty state", async () => {
  vi.mocked(getBookings).mockResolvedValue({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  render(<BookingsPage />);
  expect(await screen.findByRole("heading", { name: "No bookings yet" })).toBeInTheDocument();
});

test("shows an error and can retry", async () => {
  vi.mocked(getBookings).mockRejectedValueOnce(new Error("Unavailable"));
  render(<BookingsPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Bookings could not be loaded");
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));

  expect(await screen.findByText("Maya Thompson")).toBeInTheDocument();
  expect(getBookings).toHaveBeenCalledTimes(2);
});

test("loads more bookings without replacing the existing list", async () => {
  vi.mocked(getBookings)
    .mockResolvedValueOnce({ ...firstPage, count: 3, next: "page-2" })
    .mockResolvedValueOnce({
      count: 3,
      next: null,
      previous: "page-1",
      results: [{
        ...firstPage.results[0],
        id: 3,
        student: {
          id: 12,
          first_name: "Zoe",
          last_name: "Clarke",
          year_group: "Year 10",
        },
      }],
    });
  render(<BookingsPage />);
  await screen.findByText("Maya Thompson");

  await userEvent.click(screen.getByRole("button", { name: "Load more bookings" }));

  expect(await screen.findByText("Zoe Clarke")).toBeInTheDocument();
  expect(screen.getByText("Maya Thompson")).toBeInTheDocument();
  expect(getBookings).toHaveBeenLastCalledWith(2);
});
