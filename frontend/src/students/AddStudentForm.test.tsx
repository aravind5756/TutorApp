import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createStudent } from "../api/students";
import { AddStudentForm } from "./AddStudentForm";

vi.mock("../api/students", () => ({ createStudent: vi.fn() }));

const student = {
  id: 1, first_name: "Maya", last_name: "Thompson", year_group: "Year 11",
  subjects: "Mathematics, Physics", is_active: true,
};

beforeEach(() => vi.mocked(createStudent).mockResolvedValue(student));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

test("requires both student names", async () => {
  render(<AddStudentForm onCancel={vi.fn()} onCreated={vi.fn()} />);
  expect(screen.getByLabelText("First name")).toBeRequired();
  expect(screen.getByLabelText("Last name")).toBeRequired();
  await userEvent.click(screen.getByRole("button", { name: "Add student" }));
  expect(createStudent).not.toHaveBeenCalled();
});

test("trims and submits student details", async () => {
  const onCreated = vi.fn();
  render(<AddStudentForm onCancel={vi.fn()} onCreated={onCreated} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("First name"), "  Maya  ");
  await user.type(screen.getByLabelText("Last name"), "  Thompson  ");
  await user.type(screen.getByLabelText(/Year group/), "Year 11");
  await user.type(screen.getByLabelText(/Subjects/), "Mathematics, Physics");
  await user.click(screen.getByRole("button", { name: "Add student" }));

  expect(createStudent).toHaveBeenCalledWith({
    first_name: "Maya", last_name: "Thompson", year_group: "Year 11",
    subjects: "Mathematics, Physics",
  });
  expect(onCreated).toHaveBeenCalledWith(student);
});

test("reports a failure and keeps the form available", async () => {
  vi.mocked(createStudent).mockRejectedValue(new Error("Unavailable"));
  render(<AddStudentForm onCancel={vi.fn()} onCreated={vi.fn()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("First name"), "Maya");
  await user.type(screen.getByLabelText("Last name"), "Thompson");
  await user.click(screen.getByRole("button", { name: "Add student" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("could not be added");
  expect(screen.getByRole("button", { name: "Add student" })).toBeEnabled();
});

test("can be cancelled", async () => {
  const onCancel = vi.fn();
  render(<AddStudentForm onCancel={onCancel} onCreated={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});
