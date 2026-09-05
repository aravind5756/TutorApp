import { afterEach, test, expect, vi } from "vitest";

import { getStudents } from "./students";

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
