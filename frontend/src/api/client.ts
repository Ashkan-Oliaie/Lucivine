import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth";

/** Explicit API origin (no trailing slash). When unset in dev, use same-origin `/api` + Vite proxy (works from LAN IPs). */
function explicitApiOrigin(): string | undefined {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw || raw.length === 0) return undefined;
  try {
    const u = new URL(raw);
    // Docker Compose service name — only resolves inside the backend container network, never in the browser.
    if (u.hostname === "backend") return undefined;
    return u.origin;
  } catch {
    return undefined;
  }
}

const apiOrigin = explicitApiOrigin();

export const api = axios.create({
  baseURL: apiOrigin ? `${apiOrigin}/api` : "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const access = useAuthStore.getState().access;
  if (access) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refresh = useAuthStore.getState().refresh;
  if (!refresh) return null;
  try {
    const refreshUrl =
      apiOrigin !== undefined ? `${apiOrigin}/api/auth/refresh/` : "/api/auth/refresh/";
    const resp = await axios.post<{ access: string; refresh?: string }>(
      refreshUrl,
      { refresh },
    );
    useAuthStore.getState().setTokens(resp.data.access, resp.data.refresh ?? refresh);
    return resp.data.access;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }
    const isAuthEndpoint =
      typeof original.url === "string" &&
      (original.url.includes("/auth/login") ||
        original.url.includes("/auth/register") ||
        original.url.includes("/auth/refresh"));
    if (isAuthEndpoint) return Promise.reject(error);

    original._retry = true;
    refreshing ??= performRefresh().finally(() => {
      refreshing = null;
    });
    const newAccess = await refreshing;
    if (!newAccess) return Promise.reject(error);

    original.headers = original.headers ?? {};
    (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
    return api.request(original);
  },
);

export type ApiError = {
  error: { code: string; message: string; details?: unknown };
};

export function extractMessage(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError<ApiError>(err) && err.response?.data?.error) {
    return err.response.data.error.message ?? fallback;
  }
  return fallback;
}
