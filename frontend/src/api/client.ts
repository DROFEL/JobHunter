import { z } from "zod"

const API_BASE = (import.meta.env.VITE_WEB_API_URL as string | undefined) ?? "/api"

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiFetch<T>(
  method: string,
  path: string,
  schema: z.ZodSchema<T>,
  body?: unknown,
): Promise<T> {
  const init: RequestInit = { 
    method,
    headers: {"Authentication": "1"}
  }

  if (body !== undefined) {
    init.headers = {
      ...(init.headers as Record<string, string>),
      "Content-Type": "application/json",
    }
    init.body = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, init)

  if (!res.ok) {
    throw new ApiError(res.status, `${method} ${path} → ${res.status} ${res.statusText}`)
  }

  // 204 No Content or empty body — parse undefined so callers get void
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return schema.parse(undefined)
  }

  const json: unknown = await res.json()
  return schema.parse(json)
}

export const api = {
  get: <T>(path: string, schema: z.ZodSchema<T>): Promise<T> =>
    apiFetch("GET", path, schema),

  post: <T>(path: string, schema: z.ZodSchema<T>, body: unknown): Promise<T> =>
    apiFetch("POST", path, schema, body),

  patch: <T>(path: string, schema: z.ZodSchema<T>, body: unknown): Promise<T> =>
    apiFetch("PATCH", path, schema, body),

  delete: async (path: string): Promise<void> => {
    const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" })
    if (!res.ok) {
      throw new ApiError(res.status, `DELETE ${path} → ${res.status} ${res.statusText}`)
    }
  },
}
