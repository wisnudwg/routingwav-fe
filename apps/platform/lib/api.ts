export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}

export type Fail = { ok: false; code?: string; message: string; fields?: Record<string, string> }

/** For callers that prefer a result object over try/catch. A validation error shows its first field message. */
export function toFail(e: unknown): Fail {
  if (e instanceof ApiError) {
    const first = e.code === "VALIDATION" ? Object.values(e.fields ?? {})[0] : undefined
    return { ok: false, code: e.code, message: first ?? e.message, fields: e.fields }
  }
  return { ok: false, message: "Terjadi kesalahan." }
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000/v1")

let onUnauthenticated: (() => void) | null = null
export const setUnauthenticatedHandler = (fn: () => void) => {
  onUnauthenticated = fn
}

type Options = Omit<RequestInit, "body"> & { json?: unknown }
type ErrorBody = { code?: string; message?: string; fields?: Record<string, string> }

export async function api<T = unknown>(path: string, { json, headers, ...init }: Options = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: "include", // send the session cookie
      ...init,
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    })
  } catch {
    throw new ApiError(0, "NETWORK", "Tidak dapat terhubung ke server. Periksa koneksi Anda.")
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {}

  if (!res.ok) {
    const b = (body ?? {}) as ErrorBody
    const err = new ApiError(res.status, b.code ?? "ERROR", b.message ?? "Terjadi kesalahan.", b.fields)
    // The session ended (expired, revoked, disabled): let the app drop its state and redirect
    if (res.status === 401 && err.code === "UNAUTHENTICATED") onUnauthenticated?.()
    throw err
  }
  return body as T
}