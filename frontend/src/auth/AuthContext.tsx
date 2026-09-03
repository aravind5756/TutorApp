import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  type AuthenticatedUser,
  type LoginCredentials,
} from "../api/auth";
import { ApiError } from "../api/client";

export type AuthenticationStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";

export type AuthContextValue = {
  user: AuthenticatedUser | null;
  status: AuthenticationStatus;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [status, setStatus] = useState<AuthenticationStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setStatus("authenticated");
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setUser(null);
        setStatus("unauthenticated");

        if (!(requestError instanceof ApiError && requestError.status === 403)) {
          setError("TutorDesk could not check your session.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setError(null);

    try {
      const authenticatedUser = await loginRequest(credentials);
      setUser(authenticatedUser);
      setStatus("authenticated");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "TutorDesk could not sign you in.",
      );
      throw requestError;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);

    try {
      await logoutRequest();
      setUser(null);
      setStatus("unauthenticated");
    } catch (requestError) {
      setError("TutorDesk could not sign you out.");
      throw requestError;
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, error, login, logout }),
    [error, login, logout, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
