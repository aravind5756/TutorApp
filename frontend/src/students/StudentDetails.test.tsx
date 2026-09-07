import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { getStudent, type StudentDetail } from "../api/students";
import { StudentDetails } from "./StudentDetails";

vi.mock("../api/students", () => ({ getStudent: vi.fn() }));

const student: StudentDetail = {
  id: 7,
  first_name: "Maya",
  last_name: "Thompson",
  year_group: "Year 11",
  subjects: "Mathematics\nPhysics",
  goals: "Improve confidence with algebra",
  learning_needs: "Benefits from worked examples",
  is_active: true,
  created_at: "2026-09-01T10:00:00+01:00",
  updated_at: "2026-09-06T19:00:00+01:00",
};

beforeEach(() => {
  vi.mocked(getStudent).mockResolvedValue(student);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

test("shows a loading state while requesting the student", () => {
  vi.mocked(getStudent).mockReturnValue(new Promise(() => {}));
  render(<StudentDetails studentId={7} onBack={vi.fn()} />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading student details");
  expect(getStudent).toHaveBeenCalledWith(7);
});

test("shows the complete student record and privacy label", async () => {
  render(<StudentDetails studentId={7} onBack={vi.fn()} />);

  expect(await screen.findByRole("heading", { name: "Maya Thompson" })).toBeInTheDocument();
  expect(screen.getByText("Year 11")).toBeInTheDocument();
  expect(screen.getByText(/Mathematics/)).toHaveTextContent("Mathematics Physics");
  expect(screen.getByText("Improve confidence with algebra")).toBeInTheDocument();
  expect(screen.getByText("Benefits from worked examples")).toBeInTheDocument();
  expect(screen.getByText("Never shown in student or guardian portals")).toBeInTheDocument();
  expect(screen.getByText("Record updated 6 Sept 2026")).toBeInTheDocument();
});

test("shows useful placeholders and inactive status for an incomplete record", async () => {
  vi.mocked(getStudent).mockResolvedValue({
    ...student,
    year_group: "",
    subjects: "",
    goals: "",
    learning_needs: "",
    is_active: false,
  });
  render(<StudentDetails studentId={7} onBack={vi.fn()} />);

  expect(await screen.findByText("Inactive student")).toBeInTheDocument();
  expect(screen.getByText("Year group not set")).toBeInTheDocument();
  expect(screen.getByText("No subjects added yet.")).toBeInTheDocument();
  expect(screen.getByText("No learning goals added yet.")).toBeInTheDocument();
  expect(screen.getByText("No private learning notes added yet.")).toBeInTheDocument();
});

test("shows an error and can retry loading the record", async () => {
  vi.mocked(getStudent).mockRejectedValueOnce(new Error("Unavailable"));
  render(<StudentDetails studentId={7} onBack={vi.fn()} />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Student details could not be loaded");
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("heading", { name: "Maya Thompson" })).toBeInTheDocument();
  expect(getStudent).toHaveBeenCalledTimes(2);
});

test("returns to the student list", async () => {
  const onBack = vi.fn();
  render(<StudentDetails studentId={7} onBack={onBack} />);

  await userEvent.click(screen.getByRole("button", { name: "Back to students" }));
  expect(onBack).toHaveBeenCalledTimes(1);
});
