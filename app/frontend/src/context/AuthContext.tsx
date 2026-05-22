import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { storage } from "../utils/storage";
import { api, setToken } from "../api/client";

export type Role = "agente" | "gestor";
export interface AuthUser {
  matricula: string;
  nome: string;
  role: Role;
  setor: string;
}

const USER_KEY = "vigiar.user";

interface AuthState {
  loading: boolean;
  user: AuthUser | null;
  login: (matricula: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restore session (offline-friendly: we trust cached user/token until backend refuses).
  useEffect(() => {
    (async () => {
      try {
        const cached = await storage.getItem<string>(USER_KEY, "");

        if (cached) {
          try {
            const u = JSON.parse(cached) as AuthUser;
            setUser(u);
          } catch {
            /* ignore */
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (matricula: string, password: string) => {
    const res = await api<{ access_token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: { matricula, password },
      auth: false,
    });
    await setToken(res.access_token);
    await storage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    await storage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(() => ({ loading, user, login, logout }), [loading, user, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside <AuthProvider>");
  return v;
}
