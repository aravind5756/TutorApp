import { afterEach, test, expect, vi } from "vitest";

import { createStudent, getStudent, getStudents } from "./students";

vi.mock("./auth", () => ({ getCsrfToken: vi.fn().mockResolvedValue("csrf-token") }));

afterEach(() => {
  vi.unstubAllGlobals();
});

test("requests the first student page with the current session", async () => {
  const response = { count: 0, next: null, previous: null, results: [] };
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true, status: 200, json: async () => response,
  });
  vi.stubGlobal("fetch", fetchMock);

  await expect(getStudents()).resolves.toEqual(response);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/students/",
    expect.objectContaining({ credentials: "include" }),
  );
});

test("requests a specific student page", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ count: 0, next: null, previous: null, results: [] }),
  }));

  await getStudents(2);

  expect(fetch).toHaveBeenCalledWith(
    "/api/v1/students/?page=2",
    expect.any(Object),
  );
});

test("creates a student with CSRF protection", async () => {
  const student = {
    id: 1, first_name: "Maya", last_name: "Thompson", year_group: "Year 11",
    subjects: "Mathematics", is_active: true,
  };
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true, status: 201, json: async () => student,
  });
  vi.stubGlobal("fetch", fetchMock);

  await expect(createStudent({
    first_name: "Maya", last_name: "Thompson", year_group: "Year 11",
    subjects: "Mathematics",
  })).resolves.toEqual(student);

  const request = fetchMock.mock.calls[0][1] as RequestInit;
  expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/students/");
  expect(request.method).toBe("POST");
  expect((request.headers as Headers).get("X-CSRFToken")).toBe("csrf-token");
  expect(JSON.parse(request.body as string)).toEqual({
    first_name: "Maya", last_name: "Thompson", year_group: "Year 11",
    subjects: "Mathematics",
  });
});

test("loads an individual student's complete record", async () => {
  const student = {
    id: 7,
    first_name: "Maya",
    last_name: "Thompson",
    year_group: "Year 11",
    subjects: "Mathematics",
    goals: "Improve confidence with algebra",
    learning_needs: "Benefits from worked examples",
    is_active: true,
    created_at: "2026-09-01T10:00:00+01:00",
    updated_at: "2026-09-06T19:00:00+01:00",
  };
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => student,
  });
  vi.stubGlobal("fetch", fetchMock);

  await expect(getStudent(7)).resolves.toEqual(student);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/students/7/",
    expect.objectContaining({ credentials: "include" }),
  );
});

test("reports when an individual student does not exist", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
    json: async () => ({ detail: "No StudentProfile matches the given query." }),
  }));

  await expect(getStudent(999999)).rejects.toMatchObject({
    status: 404,
    message: "No StudentProfile matches the given query.",
  });
});
