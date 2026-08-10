const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000");

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const TOKEN_KEY = "smit.accessToken";
const REFRESH_KEY = "smit.refreshToken";

export const tokenStore = {
  getAccess(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    const json = (await res.json()) as { success: boolean; tokens?: { accessToken: string; refreshToken: string } };
    if (!json.success || !json.tokens) return null;
    tokenStore.set(json.tokens.accessToken, json.tokens.refreshToken);
    return json.tokens.accessToken;
  } catch {
    return null;
  }
}

let refreshPromise: Promise<string | null> | null = null;

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers, skipAuth } = options;

  const build = (token?: string | null) => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  const token = tokenStore.getAccess();
  const run = async (accessToken?: string | null) => {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: build(accessToken),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "omit",
    });

    if (res.status === 401 && !skipAuth) {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (!newToken) {
        tokenStore.clear();
        throw new ApiError(401, "UNAUTHORIZED", "Session expired. Please sign in again.");
      }
      return run(newToken);
    }

    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      error?: { code?: string; message?: string };
    } | null;

    if (!res.ok) {
      throw new ApiError(res.status, json?.error?.code ?? "ERROR", json?.error?.message ?? "Request failed");
    }

    return json as T;
  };

  return run(token);
}

export async function apiForm<T>(path: string, formData: FormData): Promise<T> {
  const run = async (accessToken?: string | null) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        tokenStore.clear();
        throw new ApiError(401, "UNAUTHORIZED", "Session expired. Please sign in again.");
      }
      return run(newToken);
    }

    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      error?: { code?: string; message?: string };
    } | null;

    if (!res.ok) {
      throw new ApiError(res.status, json?.error?.code ?? "ERROR", json?.error?.message ?? "Request failed");
    }
    return json as T;
  };

  return run(tokenStore.getAccess());
}

export async function streamChat(
  payload: { conversationId?: string | null; courseId?: string | null; message: string },
  handlers: {
    onMeta?: (meta: { conversationId: string; sources?: unknown[] }) => void;
    onToken: (delta: string) => void;
    onDone: (done: { content: string; sources: unknown[] }) => void;
    onError: (message: string) => void;
  },
): Promise<void> {
  const run = async (accessToken?: string | null): Promise<void> => {
    const res = await fetch(`${API_URL}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        handlers.onError("Session expired. Please sign in again.");
        return;
      }
      return run(newToken);
    }

    if (!res.ok || !res.body) {
      const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      handlers.onError(json?.error?.message ?? "Failed to start chat stream");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let finalSources: unknown[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const lines = raw.split("\n");
          let type = "message";
          const dataLines: string[] = [];
          for (const line of lines) {
            if (line.startsWith("event: ")) type = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataLines.push(line.slice(6));
          }
          if (dataLines.length === 0) continue;
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
          } catch {
            continue;
          }

          switch (type) {
            case "conversation":
              handlers.onMeta?.({ conversationId: String(data.id) });
              break;
            case "meta":
              handlers.onMeta?.({
                conversationId: String(data.conversationId ?? ""),
                sources: (data.sources as unknown[]) ?? [],
              });
              break;
            case "token":
              fullContent += String(data.delta ?? "");
              handlers.onToken(String(data.delta ?? ""));
              break;
            case "message":
              finalSources = (data.sources as unknown[]) ?? [];
              handlers.onDone({
                content: String(data.content ?? fullContent),
                sources: finalSources,
              });
              break;
            case "error":
              handlers.onError(String(data.message ?? "Something went wrong"));
              return;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  return run(tokenStore.getAccess());
}
