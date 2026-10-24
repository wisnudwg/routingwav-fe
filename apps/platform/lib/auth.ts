import { useMemo, useSyncExternalStore } from "react"
import { isProfileKind, type ProfileKind } from "./roles"

export type PendingStep = "complete-profile" | "change-password"

type Access = {
  /** Profiles this account has. A person can be Talent, Client, or both. */
  profiles: ProfileKind[]
  /** Which one is active right now. Only absent while the first profile is still being created. */
  mode?: ProfileKind
}

export type Session =
  | ({ type: "root"; email: string; name?: string; pending?: "complete-profile" } & Access)
  | ({ type: "iam"; account: string; username: string; pending?: "change-password" } & Access)

const SESSION_KEY = "session"
const ACCOUNT_KEY = "last-iam-account" // convenience only, not sensitive
const EVENT = "auth-change"

/** Stable identifier of whoever is signed in (e.g. to key push subscriptions) */
export const sessionId = (s: Session) =>
  s.type === "root" ? s.email : `${s.username}@${s.account}`

export const DASHBOARD_HOME: Record<ProfileKind, string> = {
  talent: "/sales-orders", // moves to /talent/... in the dashboard batch
  client: "/client",
}

/** Where a session should land: its unfinished step, or the dashboard for its active mode */
export const homeFor = (s: Session) =>
  s.pending ? `/auth/${s.pending}` : DASHBOARD_HOME[s.mode ?? s.profiles[0] ?? "talent"]

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

function parseAccess(v: Record<string, unknown>, pending: boolean): Access {
  // Sessions saved before profiles existed have none: treat them as Talent
  let profiles: ProfileKind[] = Array.isArray(v.profiles)
    ? Array.from(new Set((v.profiles as unknown[]).filter(isProfileKind)))
    : ["talent"]
  if (profiles.length === 0 && !pending) profiles = ["talent"] // only a pending sign-up may have none
  const mode = isProfileKind(v.mode) && profiles.includes(v.mode) ? v.mode : profiles[0]
  return { profiles, mode }
}

function parse(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Record<string, unknown> | null
    if (!v) return null

    if (v.type === "root" && typeof v.email === "string") {
      const pending = v.pending === "complete-profile" ? ("complete-profile" as const) : undefined
      return {
        type: "root",
        email: v.email,
        name: typeof v.name === "string" ? v.name : undefined,
        pending,
        ...parseAccess(v, !!pending),
      }
    }
    if (v.type === "iam" && typeof v.account === "string" && typeof v.username === "string") {
      const pending = v.pending === "change-password" ? ("change-password" as const) : undefined
      return {
        type: "iam",
        account: v.account,
        username: v.username,
        pending,
        ...parseAccess(v, !!pending),
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

/** Switch the active profile. Ignored if the account doesn't have it. */
export function switchMode(mode: ProfileKind) {
  const s = getSession()
  if (s && s.profiles.includes(mode)) storeSession({ ...s, mode })
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