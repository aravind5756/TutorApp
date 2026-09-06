import { afterEach, test, expect, vi } from "vitest";

import { createStudent, getStudents } from "./students";

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
