import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import {
  createBooking,
  getBooking,
  getBookings,
  type BookingListResponse,
} from "../api/bookings";
import { getStudents } from "../api/students";
import { BookingsPage } from "./BookingsPage";

vi.mock("../api/bookings", () => ({
  createBooking: vi.fn(),
  getBooking: vi.fn(),
  getBookings: vi.fn(),
}));
vi.mock("../api/students", () => ({ getStudents: vi.fn() }));

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
  vi.mocked(getBooking).mockResolvedValue(firstPage.results[0]);
  vi.mocked(getStudents).mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [{
      id: 4,
      first_name: "Maya",
      last_name: "Thompson",
      year_group: "Year 11",
      subjects: "Mathematics",
      is_active: true,
    }],
  });
  vi.mocked(createBooking).mockResolvedValue({
    ...firstPage.results[0],
    id: 5,
    student: {
      id: 15,
      first_name: "Zoe",
      last_name: "Clarke",
      year_group: "Year 10",
    },
    starts_at: "2026-09-09T09:00",
    ends_at: "2026-09-09T10:00",
  });
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

test("opens the form and adds a created booking to the list", async () => {
  render(<BookingsPage />);
  await screen.findByText("Maya Thompson");

  await userEvent.click(screen.getByRole("button", { name: "New booking" }));
  await screen.findByRole("option", { name: "Maya Thompson · Year 11" });
  fireEvent.change(screen.getByLabelText("Starts"), {
    target: { value: "2026-09-09T09:00" },
  });
  fireEvent.change(screen.getByLabelText("Ends"), {
    target: { value: "2026-09-09T10:00" },
  });
  await userEvent.click(screen.getByRole("button", { name: "Create booking" }));

  expect(await screen.findByText("Zoe Clarke")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "New booking" })).not.toBeInTheDocument();
  expect(screen.getByText("Showing 3 bookings")).toBeInTheDocument();
});

test("opens a booking record and returns to the list", async () => {
  render(<BookingsPage />);
  await screen.findByText("Maya Thompson");

  await userEvent.click(
    screen.getByRole("button", { name: "View booking for Maya Thompson" }),
  );

  expect(await screen.findByRole("heading", { name: "Maya Thompson" })).toBeInTheDocument();
  expect(getBooking).toHaveBeenCalledWith(1);

  await userEvent.click(screen.getByRole("button", { name: "Back to bookings" }));

  expect(screen.getByRole("heading", { name: "Bookings" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "View booking for Maya Thompson" }),
  ).toBeInTheDocument();
});

test("selects the all bookings filter by default", async () => {
  render(<BookingsPage />);
  await screen.findByText("Maya Thompson");

  expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "Confirmed" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(getBookings).toHaveBeenCalledWith(1);
});

test("loads bookings for the selected status", async () => {
  vi.mocked(getBookings)
    .mockResolvedValueOnce(firstPage)
    .mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [firstPage.results[0]],
    });
  render(<BookingsPage />);
  await screen.findByText("Alex Reed");

  await userEvent.click(screen.getByRole("button", { name: "Confirmed" }));

  expect(await screen.findByText("Showing 1 booking")).toBeInTheDocument();
  expect(screen.getByText("Maya Thompson")).toBeInTheDocument();
  expect(screen.queryByText("Alex Reed")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Confirmed" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(getBookings).toHaveBeenLastCalledWith(1, { status: "confirmed" });
});

test("shows an empty state for a status with no bookings", async () => {
  vi.mocked(getBookings)
    .mockResolvedValueOnce(firstPage)
    .mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
  render(<BookingsPage />);
  await screen.findByText("Maya Thompson");

  await userEvent.click(screen.getByRole("button", { name: "Cancelled" }));

  expect(
    await screen.findByRole("heading", { name: "No cancelled bookings" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Try another status or create a new booking.")).toBeInTheDocument();
  expect(getBookings).toHaveBeenLastCalledWith(1, { status: "cancelled" });
});

test("keeps the selected status when loading more bookings", async () => {
  vi.mocked(getBookings)
    .mockResolvedValueOnce(firstPage)
    .mockResolvedValueOnce({
      count: 2,
      next: "page-2",
      previous: null,
      results: [firstPage.results[0]],
    })
    .mockResolvedValueOnce({
      count: 2,
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

  await userEvent.click(screen.getByRole("button", { name: "Confirmed" }));
  await screen.findByRole("button", { name: "Load more bookings" });
  await userEvent.click(screen.getByRole("button", { name: "Load more bookings" }));

  expect(await screen.findByText("Zoe Clarke")).toBeInTheDocument();
  expect(screen.getByText("Maya Thompson")).toBeInTheDocument();
  expect(getBookings).toHaveBeenLastCalledWith(2, { status: "confirmed" });
});
