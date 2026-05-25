import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { env } from "@/shared/config/env";
import { useAuthStore } from "@/shared/auth/store";

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      cfg.headers = cfg.headers ?? {};
      (cfg.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return cfg;
});

let refreshing: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) {
    clear();
    return null;
  }
  try {
    const res = await axios.post(
      `${env.apiBaseUrl}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    const { accessToken, refreshToken: nextRefresh, expiresIn } = res.data as {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    setTokens({ accessToken, refreshToken: nextRefresh, expiresIn });
    return accessToken;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const cfg = err.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (err.response?.status !== 401 || !cfg || cfg._retry || cfg.url?.includes("/auth/")) {
      return Promise.reject(err);
    }
    cfg._retry = true;
    refreshing ??= tryRefresh().finally(() => {
      refreshing = null;
    });
    const token = await refreshing;
    if (!token) return Promise.reject(err);
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    return api.request(cfg);
  },
);

export function extractApiError(err: unknown, fallback = "Xatolik yuz berdi"): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? fallback;
  return typeof msg === "string" ? msg : fallback;
}
