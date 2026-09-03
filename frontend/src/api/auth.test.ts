import { afterEach, describe, expect, test, vi } from "vitest";

import { getCurrentUser, login } from "./auth";


const tutor = {
  id: 1,
  email: "tutor@example.com",
  first_name: "Alex",
  last_name: "Reed",
  role: "tutor",
};

function response(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "csrftoken=; Max-Age=0; path=/";
});


describe("authentication API", () => {
  test("loads the current user with session credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(tutor));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUser()).resolves.toEqual(tutor);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/me/",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  test("reports an unauthenticated current-user request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ detail: "Authentication required." }, 403)),
    );

    await expect(getCurrentUser()).rejects.toMatchObject({
      status: 403,
    });
  });

  test("obtains a CSRF cookie before login", async () => {
    document.cookie = "csrftoken=test-csrf-token; path=/";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ detail: "CSRF cookie set." }))
      .mockResolvedValueOnce(response(tutor));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({
        email: "tutor@example.com",
        password: "a-secure-test-password",
      }),
    ).resolves.toEqual(tutor);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/auth/csrf/",
      expect.objectContaining({ credentials: "include" }),
    );

    const loginRequest = fetchMock.mock.calls[1][1] as RequestInit;
    expect(loginRequest.method).toBe("POST");
    expect((loginRequest.headers as Headers).get("X-CSRFToken")).toBe(
      "test-csrf-token",
    );
  });
});
