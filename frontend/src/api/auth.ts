import { apiRequest } from "./client";

export type AuthenticatedUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "tutor" | "student" | "guardian";
};

export type LoginCredentials = {
  email: string;
  password: string;
};

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export async function getCsrfToken(): Promise<string> {
  await apiRequest<{ detail: string }>("/auth/csrf/");

  const token = readCookie("csrftoken");

  if (!token) {
    throw new Error("The CSRF cookie was not provided by the server.");
  }

  return token;
}

export function getCurrentUser(): Promise<AuthenticatedUser> {
  return apiRequest<AuthenticatedUser>("/auth/me/");
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthenticatedUser> {
  const token = await getCsrfToken();

  return apiRequest<AuthenticatedUser>("/auth/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": token,
    },
    body: JSON.stringify(credentials),
  });
}

export async function logout(): Promise<void> {
  const token = readCookie("csrftoken") ?? (await getCsrfToken());

  await apiRequest<void>("/auth/logout/", {
    method: "POST",
    headers: {
      "X-CSRFToken": token,
    },
  });
}
