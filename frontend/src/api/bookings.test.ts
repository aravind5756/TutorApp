import { afterEach, expect, test, vi } from "vitest";

import { getBookings } from "./bookings";

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
