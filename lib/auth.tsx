"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, tokenStore, ApiError } from "./api";
import type { UserPublic } from "@smit/shared";

interface AuthResponse {
  user: UserPublic;
  tokens: { accessToken: string; refreshToken: string };
}

interface AuthContextValue {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
          setLoading(false);
          return;
        }
        const res = await api<{ user: UserPublic }>("/api/v1/auth/me", { skipAuth: false });
        setUser(res.user);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear();
        }
      } finally {
        setLoading(false);
      }
    };
    void restore();
  }, []);

  const persist = useCallback((res: AuthResponse) => {
    tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
      });
      persist(res);
    },
    [persist],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api<AuthResponse>("/api/v1/auth/register", {
        method: "POST",
        body: { name, email, password },
        skipAuth: true,
      });
      persist(res);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      try {
        await api("/api/v1/auth/logout", {
          method: "POST",
          body: { refreshToken: refresh },
          skipAuth: true,
        });
      } catch {
        // ignore network errors on logout
      }
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
