import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { getBooking, updateBooking, type BookingSummary } from "../api/bookings";
import { BookingDetails } from "./BookingDetails";

vi.mock("../api/bookings", () => ({
  getBooking: vi.fn(),
  updateBooking: vi.fn(),
}));

const booking: BookingSummary = {
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
  location: "https://meet.example.com/maya",
};

beforeEach(() => {
  vi.mocked(getBooking).mockResolvedValue(booking);
  vi.mocked(updateBooking).mockResolvedValue({
    ...booking,
    status: "completed",
  });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

test("shows a loading state before the booking arrives", () => {
  vi.mocked(getBooking).mockReturnValue(new Promise(() => {}));

  render(<BookingDetails bookingId={1} onBack={vi.fn()} />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading booking details");
});

test("shows the complete booking record", async () => {
  render(<BookingDetails bookingId={1} onBack={vi.fn()} />);

  expect(await screen.findByRole("heading", { name: "Maya Thompson" })).toBeInTheDocument();
  expect(screen.getByText("Year 11")).toBeInTheDocument();
  expect(screen.getByText("confirmed")).toBeInTheDocument();
  expect(screen.getByText("Thursday, 10 September 2026")).toBeInTheDocument();
  expect(screen.getByText("12:00–13:00")).toBeInTheDocument();
  expect(screen.getByText("Online lesson")).toBeInTheDocument();
  expect(screen.getByText("https://meet.example.com/maya")).toBeInTheDocument();
  expect(getBooking).toHaveBeenCalledWith(1);
});

test("shows an error and can retry", async () => {
  vi.mocked(getBooking).mockRejectedValueOnce(new Error("Unavailable"));
  render(<BookingDetails bookingId={1} onBack={vi.fn()} />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Booking details could not be loaded",
  );
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));

  expect(await screen.findByRole("heading", { name: "Maya Thompson" })).toBeInTheDocument();
  expect(getBooking).toHaveBeenCalledTimes(2);
});

test("returns to the bookings list", async () => {
  const onBack = vi.fn();
  render(<BookingDetails bookingId={1} onBack={onBack} />);
  await screen.findByRole("heading", { name: "Maya Thompson" });

  await userEvent.click(screen.getByRole("button", { name: "Back to bookings" }));

  expect(onBack).toHaveBeenCalledOnce();
});

test("does not save when the status has not changed", async () => {
  render(<BookingDetails bookingId={1} onBack={vi.fn()} />);
  await screen.findByRole("heading", { name: "Maya Thompson" });

  expect(screen.getByLabelText("Status")).toHaveValue("confirmed");
  expect(screen.getByRole("button", { name: "Save status" })).toBeDisabled();
  expect(updateBooking).not.toHaveBeenCalled();
});

test("saves a new booking status", async () => {
  render(<BookingDetails bookingId={1} onBack={vi.fn()} />);
  await screen.findByRole("heading", { name: "Maya Thompson" });

  await userEvent.selectOptions(screen.getByLabelText("Status"), "completed");
  await userEvent.click(screen.getByRole("button", { name: "Save status" }));

  expect(updateBooking).toHaveBeenCalledWith(1, { status: "completed" });
  expect(await screen.findByRole("status")).toHaveTextContent("Booking status saved");
  expect(screen.getByRole("button", { name: "Save status" })).toBeDisabled();
});

test("shows that a status update is being saved", async () => {
  vi.mocked(updateBooking).mockReturnValue(new Promise(() => {}));
  render(<BookingDetails bookingId={1} onBack={vi.fn()} />);
  await screen.findByRole("heading", { name: "Maya Thompson" });

  await userEvent.selectOptions(screen.getByLabelText("Status"), "requested");
  await userEvent.click(screen.getByRole("button", { name: "Save status" }));

  expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
});

test("shows an error when a status update fails", async () => {
  vi.mocked(updateBooking).mockRejectedValue(new Error("Unavailable"));
  render(<BookingDetails bookingId={1} onBack={vi.fn()} />);
  await screen.findByRole("heading", { name: "Maya Thompson" });

  await userEvent.selectOptions(screen.getByLabelText("Status"), "cancelled");
  await userEvent.click(screen.getByRole("button", { name: "Save status" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Booking status could not be saved",
  );
  expect(screen.getByRole("button", { name: "Save status" })).toBeEnabled();
});
