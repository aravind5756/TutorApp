import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createBooking, type BookingSummary } from "../api/bookings";
import { getStudents } from "../api/students";
import { NewBookingForm } from "./NewBookingForm";

vi.mock("../api/bookings", () => ({ createBooking: vi.fn() }));
vi.mock("../api/students", () => ({ getStudents: vi.fn() }));

const studentResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 7,
      first_name: "Maya",
      last_name: "Thompson",
      year_group: "Year 11",
      subjects: "Mathematics",
      is_active: true,
    },
    {
      id: 9,
      first_name: "Alex",
      last_name: "Reed",
      year_group: "Year 9",
      subjects: "English",
      is_active: false,
    },
  ],
};

const createdBooking: BookingSummary = {
  id: 12,
  student: {
    id: 7,
    first_name: "Maya",
    last_name: "Thompson",
    year_group: "Year 11",
  },
  starts_at: "2026-09-12T16:00",
  ends_at: "2026-09-12T17:00",
  status: "confirmed",
  format: "online",
  location: "",
};

beforeEach(() => {
  vi.mocked(getStudents).mockResolvedValue(studentResponse);
  vi.mocked(createBooking).mockResolvedValue(createdBooking);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function enterTimes(startsAt = "2026-09-12T16:00", endsAt = "2026-09-12T17:00") {
  fireEvent.change(screen.getByLabelText("Starts"), { target: { value: startsAt } });
  fireEvent.change(screen.getByLabelText("Ends"), { target: { value: endsAt } });
}

test("loads every group of students and only offers active records", async () => {
  vi.mocked(getStudents)
    .mockResolvedValueOnce({ ...studentResponse, next: "page-2" })
    .mockResolvedValueOnce({
      count: 3,
      next: null,
      previous: "page-1",
      results: [{
        id: 11,
        first_name: "Zoe",
        last_name: "Clarke",
        year_group: "Year 10",
        subjects: "Physics",
        is_active: true,
      }],
    });

  render(<NewBookingForm onCancel={vi.fn()} onCreated={vi.fn()} />);

  expect(await screen.findByRole("option", { name: "Maya Thompson · Year 11" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Zoe Clarke · Year 10" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: /Alex Reed/ })).not.toBeInTheDocument();
  expect(getStudents).toHaveBeenNthCalledWith(1, 1);
  expect(getStudents).toHaveBeenNthCalledWith(2, 2);
});

test("cancels the form without creating a booking", async () => {
  const onCancel = vi.fn();
  render(<NewBookingForm onCancel={onCancel} onCreated={vi.fn()} />);
  await screen.findByRole("option", { name: "Maya Thompson · Year 11" });

  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  expect(onCancel).toHaveBeenCalledOnce();
  expect(createBooking).not.toHaveBeenCalled();
});

test("rejects an end time that is not later than the start time", async () => {
  render(<NewBookingForm onCancel={vi.fn()} onCreated={vi.fn()} />);
  await screen.findByRole("option", { name: "Maya Thompson · Year 11" });
  enterTimes("2026-09-12T17:00", "2026-09-12T16:00");

  await userEvent.click(screen.getByRole("button", { name: "Create booking" }));

  expect(screen.getByRole("alert")).toHaveTextContent("must end after it starts");
  expect(createBooking).not.toHaveBeenCalled();
});

test("submits the completed booking and returns the created record", async () => {
  const onCreated = vi.fn();
  const user = userEvent.setup();
  const submittedBooking: BookingSummary = {
    ...createdBooking,
    status: "requested",
    format: "in_person",
    location: "Central Library",
  };
  vi.mocked(createBooking).mockResolvedValue(submittedBooking);
  render(<NewBookingForm onCancel={vi.fn()} onCreated={onCreated} />);
  await screen.findByRole("option", { name: "Maya Thompson · Year 11" });
  enterTimes();
  await user.selectOptions(screen.getByLabelText("Lesson format"), "in_person");
  await user.selectOptions(screen.getByLabelText("Status"), "requested");
  await user.type(screen.getByLabelText(/Location or meeting link/), "Central Library");

  await user.click(screen.getByRole("button", { name: "Create booking" }));

  await waitFor(() => {
    expect(createBooking).toHaveBeenCalledWith({
      student: 7,
      starts_at: "2026-09-12T16:00",
      ends_at: "2026-09-12T17:00",
      format: "in_person",
      location: "Central Library",
      status: "requested",
    });
    expect(onCreated).toHaveBeenCalledWith(submittedBooking);
  });
});

test("shows an error when booking creation fails", async () => {
  vi.mocked(createBooking).mockRejectedValue(new Error("Time unavailable"));
  render(<NewBookingForm onCancel={vi.fn()} onCreated={vi.fn()} />);
  await screen.findByRole("option", { name: "Maya Thompson · Year 11" });
  enterTimes();

  await userEvent.click(screen.getByRole("button", { name: "Create booking" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("could not be added");
  expect(screen.getByRole("button", { name: "Create booking" })).toBeEnabled();
});
