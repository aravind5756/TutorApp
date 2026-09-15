import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { updateBooking, type BookingSummary } from "../api/bookings";
import { RescheduleBookingForm } from "./RescheduleBookingForm";

vi.mock("../api/bookings", () => ({ updateBooking: vi.fn() }));

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
  location: "",
};

const rescheduledBooking: BookingSummary = {
  ...booking,
  starts_at: "2026-09-10T14:00:00",
  ends_at: "2026-09-10T15:00:00",
};

beforeEach(() => {
  vi.mocked(updateBooking).mockResolvedValue(rescheduledBooking);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function changeTimes(startsAt: string, endsAt: string) {
  fireEvent.change(screen.getByLabelText("Starts"), {
    target: { value: startsAt },
  });
  fireEvent.change(screen.getByLabelText("Ends"), {
    target: { value: endsAt },
  });
}

test("prefills the current times and disables saving", () => {
  render(<RescheduleBookingForm booking={booking} onUpdated={vi.fn()} />);

  expect(screen.getByLabelText("Starts")).toHaveValue("2026-09-10T12:00");
  expect(screen.getByLabelText("Ends")).toHaveValue("2026-09-10T13:00");
  expect(screen.getByRole("button", { name: "Save new time" })).toBeDisabled();
  expect(updateBooking).not.toHaveBeenCalled();
});

test("rejects an end time that is not later than the start time", async () => {
  render(<RescheduleBookingForm booking={booking} onUpdated={vi.fn()} />);
  changeTimes("2026-09-10T15:00", "2026-09-10T14:00");

  await userEvent.click(screen.getByRole("button", { name: "Save new time" }));

  expect(screen.getByRole("alert")).toHaveTextContent("must end after it starts");
  expect(updateBooking).not.toHaveBeenCalled();
});

test("saves the new times and returns the updated booking", async () => {
  const onUpdated = vi.fn();
  render(<RescheduleBookingForm booking={booking} onUpdated={onUpdated} />);
  changeTimes("2026-09-10T14:00", "2026-09-10T15:00");

  await userEvent.click(screen.getByRole("button", { name: "Save new time" }));

  await waitFor(() => {
    expect(updateBooking).toHaveBeenCalledWith(1, {
      starts_at: "2026-09-10T14:00",
      ends_at: "2026-09-10T15:00",
    });
    expect(onUpdated).toHaveBeenCalledWith(rescheduledBooking);
  });
  expect(screen.getByRole("status")).toHaveTextContent("Booking rescheduled");
});

test("shows that the new time is being saved", async () => {
  vi.mocked(updateBooking).mockReturnValue(new Promise(() => {}));
  render(<RescheduleBookingForm booking={booking} onUpdated={vi.fn()} />);
  changeTimes("2026-09-10T14:00", "2026-09-10T15:00");

  await userEvent.click(screen.getByRole("button", { name: "Save new time" }));

  expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  expect(screen.getByLabelText("Starts")).toBeDisabled();
  expect(screen.getByLabelText("Ends")).toBeDisabled();
});

test("shows an error when the new time is rejected", async () => {
  vi.mocked(updateBooking).mockRejectedValue(new Error("Time unavailable"));
  render(<RescheduleBookingForm booking={booking} onUpdated={vi.fn()} />);
  changeTimes("2026-09-10T14:00", "2026-09-10T15:00");

  await userEvent.click(screen.getByRole("button", { name: "Save new time" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Check the time is available",
  );
  expect(screen.getByRole("button", { name: "Save new time" })).toBeEnabled();
});
