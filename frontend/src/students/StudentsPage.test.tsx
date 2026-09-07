import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createStudent, getStudent, getStudents, updateStudent, type StudentListResponse } from "../api/students";
import { StudentsPage } from "./StudentsPage";

vi.mock("../api/students", () => ({
  createStudent: vi.fn(),
  getStudent: vi.fn(),
  getStudents: vi.fn(),
  updateStudent: vi.fn(),
}));

const firstPage: StudentListResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [{
    id: 1, first_name: "Maya", last_name: "Thompson", year_group: "Year 11",
    subjects: "Mathematics\nPhysics", is_active: true,
  }, {
    id: 2, first_name: "Alex", last_name: "Reed", year_group: "",
    subjects: "", is_active: false,
  }],
};

beforeEach(() => {
  vi.mocked(getStudents).mockResolvedValue(firstPage);
  vi.mocked(createStudent).mockResolvedValue({
    id: 3, first_name: "Zoe", last_name: "Clarke", year_group: "Year 9",
    subjects: "English", is_active: true,
  });
  vi.mocked(getStudent).mockResolvedValue({
    id: 1, first_name: "Maya", last_name: "Thompson", year_group: "Year 11",
    subjects: "Mathematics", goals: "Prepare for GCSE exams",
    learning_needs: "Use worked examples", is_active: true,
    created_at: "2026-09-01T10:00:00+01:00",
    updated_at: "2026-09-06T19:00:00+01:00",
  });
  vi.mocked(updateStudent).mockResolvedValue({
    id: 1, first_name: "Aaron", last_name: "Adams", year_group: "Year 12",
    subjects: "Physics", goals: "Prepare for A-level study",
    learning_needs: "Use worked examples", is_active: false,
    created_at: "2026-09-01T10:00:00+01:00",
    updated_at: "2026-09-07T19:00:00+01:00",
  });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

test("shows a loading state before students arrive", () => {
  vi.mocked(getStudents).mockReturnValue(new Promise(() => {}));
  render(<StudentsPage />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading students");
});

test("shows student names, details and active status", async () => {
  render(<StudentsPage />);
  expect(await screen.findByText("Maya Thompson")).toBeInTheDocument();
  expect(screen.getByText("Mathematics")).toBeInTheDocument();
  expect(screen.getByText("Physics")).toBeInTheDocument();
  expect(screen.getByText("Year group not set")).toBeInTheDocument();
  expect(screen.getByText("Inactive")).toBeInTheDocument();
  expect(screen.getByText("Showing 2 students")).toBeInTheDocument();
});

test("shows an empty state", async () => {
  vi.mocked(getStudents).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
  render(<StudentsPage />);
  expect(await screen.findByRole("heading", { name: "No students yet" })).toBeInTheDocument();
});

test("shows an error and can retry", async () => {
  vi.mocked(getStudents).mockRejectedValueOnce(new Error("Unavailable"));
  render(<StudentsPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Students could not be loaded");
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Maya Thompson")).toBeInTheDocument();
  expect(getStudents).toHaveBeenCalledTimes(2);
});

test("loads the next page without replacing existing students", async () => {
  vi.mocked(getStudents)
    .mockResolvedValueOnce({ ...firstPage, count: 3, next: "page-2" })
    .mockResolvedValueOnce({
      count: 3, next: null, previous: "page-1", results: [{
        id: 3, first_name: "Zoe", last_name: "Clarke", year_group: "Year 9",
        subjects: "English", is_active: true,
      }],
    });
  render(<StudentsPage />);
  await screen.findByText("Maya Thompson");
  await userEvent.click(screen.getByRole("button", { name: "Load more students" }));
  expect(await screen.findByText("Zoe Clarke")).toBeInTheDocument();
  expect(screen.getByText("Maya Thompson")).toBeInTheDocument();
  expect(getStudents).toHaveBeenLastCalledWith(2);
});

test("opens the add form and shows a newly created student", async () => {
  render(<StudentsPage />);
  await screen.findByText("Maya Thompson");
  await userEvent.click(screen.getByRole("button", { name: "Add student" }));
  await userEvent.type(screen.getByLabelText("First name"), "Zoe");
  await userEvent.type(screen.getByLabelText("Last name"), "Clarke");
  await userEvent.click(screen.getByRole("button", { name: "Add student" }));

  expect(await screen.findByText("Zoe Clarke")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Add student" })).not.toBeInTheDocument();
});

test("opens a student record and returns to the list", async () => {
  render(<StudentsPage />);
  await screen.findByText("Maya Thompson");

  await userEvent.click(screen.getByRole("button", { name: "View Maya Thompson" }));
  expect(await screen.findByRole("heading", { name: "Maya Thompson" })).toBeInTheDocument();
  expect(getStudent).toHaveBeenCalledWith(1);
  expect(screen.getByText("Prepare for GCSE exams")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Back to students" }));
  expect(await screen.findByRole("heading", { name: "Students" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "View Maya Thompson" })).toBeInTheDocument();
});

test("keeps the student list in sync after editing a record", async () => {
  render(<StudentsPage />);
  await screen.findByText("Maya Thompson");
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "View Maya Thompson" }));
  await screen.findByRole("heading", { name: "Maya Thompson" });
  await user.click(screen.getByRole("button", { name: "Edit student" }));
  await user.clear(screen.getByLabelText("First name"));
  await user.type(screen.getByLabelText("First name"), "Aaron");
  await user.clear(screen.getByLabelText("Last name"));
  await user.type(screen.getByLabelText("Last name"), "Adams");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByRole("heading", { name: "Aaron Adams" });
  await user.click(screen.getByRole("button", { name: "Back to students" }));

  const updatedCard = screen.getByRole("button", { name: "View Aaron Adams" });
  expect(updatedCard).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "View Maya Thompson" })).not.toBeInTheDocument();
  expect(within(updatedCard).getByText("Inactive")).toBeInTheDocument();
});
