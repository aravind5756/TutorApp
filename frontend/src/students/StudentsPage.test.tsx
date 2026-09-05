import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { getStudents, type StudentListResponse } from "../api/students";
import { StudentsPage } from "./StudentsPage";

vi.mock("../api/students", () => ({ getStudents: vi.fn() }));

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
