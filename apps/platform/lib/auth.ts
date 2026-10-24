import { useMemo, useSyncExternalStore } from "react"

export type PendingStep = "complete-profile" | "change-password"

export type Session =
  | { type: "root"; email: string; name?: string; pending?: "complete-profile" }
  | { type: "iam"; account: string; username: string; pending?: "change-password" }

const SESSION_KEY = "session"
const ACCOUNT_KEY = "last-iam-account" // convenience only, not sensitive
const EVENT = "auth-change"

/** Stable identifier of whoever is signed in (e.g. to key push subscriptions) */
export const sessionId = (s: Session) =>
  s.type === "root" ? s.email : `${s.username}@${s.account}`

/** Where a session should land: its unfinished step, or the dashboard */
export const homeFor = (s: Session) => (s.pending ? `/auth/${s.pending}` : "/sales-orders")

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

function parse(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw)
    if (v?.type === "root" && typeof v.email === "string") {
      return {
        type: "root",
        email: v.email,
        name: typeof v.name === "string" ? v.name : undefined,
        pending: v.pending === "complete-profile" ? "complete-profile" : undefined,
      }
    }
    if (v?.type === "iam" && typeof v.account === "string" && typeof v.username === "string") {
      return {
        type: "iam",
        account: v.account,
        username: v.username,
        pending: v.pending === "change-password" ? "change-password" : undefined,
      }
    }
  } catch {}
  return null
}

export const getSession = () => parse(readRaw())

export function storeSession(session: Session) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
    window.localStorage.removeItem("email") // leftover from the old email-only version
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

export function getRememberedAccount(): string | null {
  try {
    return window.localStorage.getItem(ACCOUNT_KEY)
  } catch {
    return null
  }
}

export function rememberAccount(account: string | null) {
  try {
    if (account) window.localStorage.setItem(ACCOUNT_KEY, account)
    else window.localStorage.removeItem(ACCOUNT_KEY)
  } catch {}
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb) // other tabs
  window.addEventListener(EVENT, cb) // this tab
  return () => {
    window.removeEventListener("storage", cb)
    window.removeEventListener(EVENT, cb)
  }
}

/** undefined = server / hydrating, null = signed out, object = signed in */
export function useSession(): Session | null | undefined {
  const raw = useSyncExternalStore<string | null | undefined>(subscribe, readRaw, () => undefined)
  return useMemo(() => (raw === undefined ? undefined : parse(raw)), [raw])
}