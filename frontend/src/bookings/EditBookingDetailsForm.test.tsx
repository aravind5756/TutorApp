import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { updateBooking, type BookingSummary } from "../api/bookings";
import { EditBookingDetailsForm } from "./EditBookingDetailsForm";

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
  location: "https://meet.example.com/maya",
};

const updatedBooking: BookingSummary = {
  ...booking,
  format: "in_person",
  location: "Central Library",
};

beforeEach(() => {
  vi.mocked(updateBooking).mockResolvedValue(updatedBooking);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

test("prefills the lesson details and disables saving", () => {
  render(<EditBookingDetailsForm booking={booking} onUpdated={vi.fn()} />);

  expect(screen.getByLabelText("Lesson format")).toHaveValue("online");
  expect(screen.getByLabelText(/Location or meeting link/)).toHaveValue(
    "https://meet.example.com/maya",
  );
  expect(screen.getByRole("button", { name: "Save lesson details" })).toBeDisabled();
  expect(updateBooking).not.toHaveBeenCalled();
});

test("saves a new lesson format and location", async () => {
  const onUpdated = vi.fn();
  render(<EditBookingDetailsForm booking={booking} onUpdated={onUpdated} />);

  await userEvent.selectOptions(screen.getByLabelText("Lesson format"), "in_person");
  fireEvent.change(screen.getByLabelText(/Location or meeting link/), {
    target: { value: "  Central Library  " },
  });
  await userEvent.click(screen.getByRole("button", { name: "Save lesson details" }));

  await waitFor(() => {
    expect(updateBooking).toHaveBeenCalledWith(1, {
      format: "in_person",
      location: "Central Library",
    });
    expect(onUpdated).toHaveBeenCalledWith(updatedBooking);
  });
  expect(screen.getByRole("status")).toHaveTextContent("Lesson details saved");
});

test("allows an optional meeting link to be removed", async () => {
  const bookingWithoutLocation = { ...booking, location: "" };
  vi.mocked(updateBooking).mockResolvedValue(bookingWithoutLocation);
  render(<EditBookingDetailsForm booking={booking} onUpdated={vi.fn()} />);

  fireEvent.change(screen.getByLabelText(/Location or meeting link/), {
    target: { value: "" },
  });
  await userEvent.click(screen.getByRole("button", { name: "Save lesson details" }));

  expect(updateBooking).toHaveBeenCalledWith(1, {
    format: "online",
    location: "",
  });
});

test("disables the fields while lesson details are being saved", async () => {
  vi.mocked(updateBooking).mockReturnValue(new Promise(() => {}));
  render(<EditBookingDetailsForm booking={booking} onUpdated={vi.fn()} />);

  await userEvent.selectOptions(screen.getByLabelText("Lesson format"), "in_person");
  await userEvent.click(screen.getByRole("button", { name: "Save lesson details" }));

  expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  expect(screen.getByLabelText("Lesson format")).toBeDisabled();
  expect(screen.getByLabelText(/Location or meeting link/)).toBeDisabled();
});

test("shows an error when lesson details cannot be saved", async () => {
  vi.mocked(updateBooking).mockRejectedValue(new Error("Unavailable"));
  render(<EditBookingDetailsForm booking={booking} onUpdated={vi.fn()} />);

  fireEvent.change(screen.getByLabelText(/Location or meeting link/), {
    target: { value: "New meeting link" },
  });
  await userEvent.click(screen.getByRole("button", { name: "Save lesson details" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "lesson details could not be saved",
  );
  expect(screen.getByRole("button", { name: "Save lesson details" })).toBeEnabled();
});
