import { apiRequest } from "./client";


export type HealthResponse = {
  status: "ok";
};

export async function getBackendHealth(
  signal?: AbortSignal,
): Promise<HealthResponse> {
  const data: unknown = await apiRequest("/health/", {
    signal,
  });

  if (
    typeof data !== "object" ||
    data === null ||
    !("status" in data) ||
    data.status !== "ok"
  ) {
    throw new Error("Health check returned an unexpected response.");
  }

  return { status: "ok" };
}
