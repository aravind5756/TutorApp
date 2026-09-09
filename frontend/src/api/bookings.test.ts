import { afterEach, expect, test, vi } from "vitest";

import { createBooking, getBookings } from "./bookings";

vi.mock("./auth", () => ({
  getCsrfToken: vi.fn().mockResolvedValue("csrf-token"),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

test("requests the first booking page with the current session", async () => {
  const response = {
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        id: 3,
        student: {
          id: 7,
          first_name: "Maya",
          last_name: "Thompson",
          year_group: "Year 11",
        },
        starts_at: "2026-09-10T16:00:00+01:00",
        ends_at: "2026-09-10T17:00:00+01:00",
        status: "confirmed",
        format: "online",
        location: "",
      },
    ],
  };
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => response,
  });
  vi.stubGlobal("fetch", fetchMock);

  await expect(getBookings()).resolves.toEqual(response);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/bookings/",
    expect.objectContaining({ credentials: "include" }),
  );
});

test("requests a specific booking page", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ count: 0, next: null, previous: null, results: [] }),
    }),
  );

  await getBookings(2);

  expect(fetch).toHaveBeenCalledWith(
    "/api/v1/bookings/?page=2",
    expect.any(Object),
  );
});

test("creates a booking with CSRF protection", async () => {
  const newBooking = {
    student: 7,
    starts_at: "2026-09-10T16:00:00+01:00",
    ends_at: "2026-09-10T17:00:00+01:00",
    format: "online" as const,
    location: "",
    status: "confirmed" as const,
  };
  const createdBooking = {
    id: 3,
    student: {
      id: 7,
      first_name: "Maya",
      last_name: "Thompson",
      year_group: "Year 11",
    },
    starts_at: newBooking.starts_at,
    ends_at: newBooking.ends_at,
    status: newBooking.status,
    format: newBooking.format,
    location: newBooking.location,
  };
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => createdBooking,
  });
  vi.stubGlobal("fetch", fetchMock);

  await expect(createBooking(newBooking)).resolves.toEqual(createdBooking);

  const request = fetchMock.mock.calls[0][1] as RequestInit;
  expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/bookings/");
  expect(request.method).toBe("POST");
  expect(request.credentials).toBe("include");
  expect((request.headers as Headers).get("X-CSRFToken")).toBe("csrf-token");
  expect((request.headers as Headers).get("Content-Type")).toBe("application/json");
  expect(JSON.parse(request.body as string)).toEqual(newBooking);
});
