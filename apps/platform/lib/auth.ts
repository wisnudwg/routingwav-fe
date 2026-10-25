import { useMemo, useSyncExternalStore } from "react"
import { availableModes, isPermission, type Permission } from "./permissions"
import { isProfileKind, type ProfileKind } from "./roles"
import { DASHBOARD_HOME } from "./routes"

export type PendingStep = "complete-profile" | "change-password"

type Access = {
  /** Profiles this account has. A person can be Talent, Client, or both. */
  profiles: ProfileKind[]
  /** The active/last-used profile. Always one of availableModes(session), if any exists. */
  mode?: ProfileKind
}

export type Session =
  | ({ type: "root"; email: string; name?: string; pending?: "complete-profile" } & Access)
  | ({
      type: "iam"
      account: string
      username: string
      pending?: "change-password"
      /** Deny by default: an IAM user can only do what's listed here */
      permissions: Permission[]
    } & Access)

const SESSION_KEY = "session"
const ACCOUNT_KEY = "last-iam-account" // convenience only, not sensitive
const EVENT = "auth-change"

/** Stable identifier of whoever is signed in (e.g. to key push subscriptions) */
export const sessionId = (s: Session) =>
  s.type === "root" ? s.email : `${s.username}@${s.account}`

export const displayName = (s: Session) =>
  s.type === "root" ? s.name?.trim() || s.email.split("@")[0] || s.email : s.username

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?"

/** Where a session should land: its unfinished step, its dashboard, or the no-access page */
export const homeFor = (s: Session) =>
  s.pending ? `/auth/${s.pending}` : s.mode ? DASHBOARD_HOME[s.mode] : "/no-access"

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

function parseProfiles(v: Record<string, unknown>, pending: boolean): ProfileKind[] {
  // Sessions saved before profiles existed have none: treat them as Talent
  let profiles: ProfileKind[] = Array.isArray(v.profiles)
    ? Array.from(new Set((v.profiles as unknown[]).filter(isProfileKind)))
    : ["talent"]
  if (profiles.length === 0 && !pending) profiles = ["talent"] // only a pending sign-up may have none
  return profiles
}

function pickMode(s: Session, raw: unknown): ProfileKind | undefined {
  const modes = availableModes(s)
  return isProfileKind(raw) && modes.includes(raw) ? raw : modes[0]
}

function parse(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Record<string, unknown> | null
    if (!v) return null

    if (v.type === "root" && typeof v.email === "string") {
      const pending = v.pending === "complete-profile" ? ("complete-profile" as const) : undefined
      const root: Session = {
        type: "root",
        email: v.email,
        name: typeof v.name === "string" ? v.name : undefined,
        pending,
        profiles: parseProfiles(v, !!pending),
      }
      root.mode = pickMode(root, v.mode)
      return root
    }

    if (v.type === "iam" && typeof v.account === "string" && typeof v.username === "string") {
      const pending = v.pending === "change-password" ? ("change-password" as const) : undefined
      const iam: Session = {
        type: "iam",
        account: v.account,
        username: v.username,
        pending,
        profiles: parseProfiles(v, !!pending),
        permissions: Array.isArray(v.permissions)
          ? Array.from(new Set((v.permissions as unknown[]).filter(isPermission)))
          : [],
      }
      iam.mode = pickMode(iam, v.mode)
      return iam
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

/** Persist the active profile. Ignored if the user can't enter it. */
export function switchMode(mode: ProfileKind) {
  const s = getSession()
  if (s && availableModes(s).includes(mode)) storeSession({ ...s, mode })
}

/** After the "add profile" flow succeeds: owners only, new profile becomes active */
export function addProfileToSession(kind: ProfileKind) {
  const s = getSession()
  if (!s || s.type !== "root") return
  const profiles = s.profiles.includes(kind) ? s.profiles : [...s.profiles, kind]
  storeSession({ ...s, profiles, mode: kind })
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