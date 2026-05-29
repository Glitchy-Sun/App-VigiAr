// Thin fetch wrapper used by both the agent app and the manager dashboard.
import { storage } from "../utils";

const BASE = ((globalThis as any).process?.env?.EXPO_PUBLIC_BACKEND_URL as string) || "";
const TOKEN_KEY = "vigiar.token";

export async function getToken(): Promise<string | null> {
  return (await storage.secureGet<string>(TOKEN_KEY, "")) || null;
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await storage.secureSet(TOKEN_KEY, token);
  else await storage.secureRemove(TOKEN_KEY);
}

type Opts = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  auth?: boolean;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, timeoutMs = 15000 } = opts;
  const url = new URL(`${BASE}/api${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const t = await getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const txt = await res.text();
    const data = txt ? (() => { try { return JSON.parse(txt); } catch { return txt; } })() : null;
    if (!res.ok) {
      const msg = (data && typeof data === "object" && "detail" in data ? String((data as Record<string, unknown>).detail) : res.statusText) || "Erro de rede";
      throw new ApiError(res.status, msg, data);
    }
    return data as T;
  } finally {
    clearTimeout(tid);
  }
}
