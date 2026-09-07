import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { updateStudent, type StudentDetail } from "../api/students";
import { EditStudentForm } from "./EditStudentForm";

vi.mock("../api/students", () => ({ updateStudent: vi.fn() }));

const student: StudentDetail = {
  id: 7,
  first_name: "Maya",
  last_name: "Thompson",
  year_group: "Year 11",
  subjects: "Mathematics",
  goals: "Improve confidence",
  learning_needs: "Use worked examples",
  is_active: true,
  created_at: "2026-09-01T10:00:00+01:00",
  updated_at: "2026-09-07T15:00:00+01:00",
};

beforeEach(() => {
  vi.mocked(updateStudent).mockResolvedValue(student);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

test("starts with the complete student record and required names", () => {
  render(<EditStudentForm student={student} onCancel={vi.fn()} onUpdated={vi.fn()} />);

  expect(screen.getByLabelText("First name")).toHaveValue("Maya");
  expect(screen.getByLabelText("First name")).toBeRequired();
  expect(screen.getByLabelText("Last name")).toHaveValue("Thompson");
  expect(screen.getByLabelText("Last name")).toBeRequired();
  expect(screen.getByLabelText(/Year group/)).toHaveValue("Year 11");
  expect(screen.getByLabelText(/Subjects/)).toHaveValue("Mathematics");
  expect(screen.getByLabelText(/Learning goals/)).toHaveValue("Improve confidence");
  expect(screen.getByLabelText(/Private learning notes/)).toHaveValue("Use worked examples");
  expect(screen.getByRole("checkbox", { name: "Active student" })).toBeChecked();
  expect(screen.getByText("Never shown in student or guardian portals.")).toBeInTheDocument();
});

test("trims and submits all edited fields", async () => {
  const updatedStudent = {
    ...student,
    first_name: "Maya-Rose",
    year_group: "Year 12",
    goals: "Prepare for A-level study",
    is_active: false,
  };
  vi.mocked(updateStudent).mockResolvedValue(updatedStudent);
  const onUpdated = vi.fn();
  render(<EditStudentForm student={student} onCancel={vi.fn()} onUpdated={onUpdated} />);
  const user = userEvent.setup();

  await user.clear(screen.getByLabelText("First name"));
  await user.type(screen.getByLabelText("First name"), "  Maya-Rose  ");
  await user.clear(screen.getByLabelText(/Year group/));
  await user.type(screen.getByLabelText(/Year group/), "  Year 12  ");
  await user.clear(screen.getByLabelText(/Learning goals/));
  await user.type(screen.getByLabelText(/Learning goals/), "  Prepare for A-level study  ");
  await user.click(screen.getByRole("checkbox", { name: "Active student" }));
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(updateStudent).toHaveBeenCalledWith(7, {
    first_name: "Maya-Rose",
    last_name: "Thompson",
    year_group: "Year 12",
    subjects: "Mathematics",
    goals: "Prepare for A-level study",
    learning_needs: "Use worked examples",
    is_active: false,
  });
  expect(onUpdated).toHaveBeenCalledWith(updatedStudent);
});

test("disables the form and prevents duplicate saves while submitting", async () => {
  let finishUpdate!: (student: StudentDetail) => void;
  vi.mocked(updateStudent).mockReturnValue(new Promise((resolve) => { finishUpdate = resolve; }));
  render(<EditStudentForm student={student} onCancel={vi.fn()} onUpdated={vi.fn()} />);

  await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  expect(screen.getByLabelText("First name")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  expect(updateStudent).toHaveBeenCalledTimes(1);

  await act(async () => { finishUpdate(student); });
});

test("reports a failure and keeps the form available", async () => {
  vi.mocked(updateStudent).mockRejectedValue(new Error("Unavailable"));
  render(<EditStudentForm student={student} onCancel={vi.fn()} onUpdated={vi.fn()} />);

  await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
  expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
});

test("can be cancelled without saving", async () => {
  const onCancel = vi.fn();
  render(<EditStudentForm student={student} onCancel={onCancel} onUpdated={vi.fn()} />);

  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(updateStudent).not.toHaveBeenCalled();
});
