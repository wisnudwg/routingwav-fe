import { useEffect, useMemo, useSyncExternalStore } from "react"
import { api, ApiError, setUnauthenticatedHandler } from "./api"
import type { EmailStatus, Permission, SessionView } from "./api-types"
import { mirrorSession } from "./mock-bridge"
import { homeHref } from "./nav-config"
import { availableModes } from "./permissions"
import { isProfileKind, type ProfileKind } from "./roles"

export type { EmailStatus }
export type PendingStep = "complete-profile" | "change-password"

type Access = { profiles: ProfileKind[]; mode?: ProfileKind }

export type Session =
  | ({ type: "root"; email: string; name?: string; alias?: string; pending?: "complete-profile" } & Access)
  | ({
      type: "iam"
      account: string
      username: string
      name?: string
      pending?: "change-password"
      permissions: Permission[]
      notificationEmail: EmailStatus
    } & Access)

/** Stable identifier of whoever is signed in (e.g. to key push subscriptions) */
export const sessionId = (s: Session) => (s.type === "root" ? s.email : `${s.username}@${s.account}`)

export const displayName = (s: Session) =>
  s.name?.trim() || (s.type === "root" ? s.email.split("@")[0] || s.email : s.username)

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?"

/** Where a session should land: its unfinished step, its first allowed page, or /no-access */
export function homeFor(s: Session): string {
  if (s.pending) return `/auth/${s.pending}`
  const modes = [s.mode, ...availableModes(s)].filter((m): m is ProfileKind => !!m)
  for (const m of modes) {
    const href = homeHref(s, m)
    if (href) return href
  }
  return "/no-access"
}

/* ------------------------------------------------------------------ store */

type Store = { status: "loading" | "ready"; server: SessionView | null }
const LOADING: Store = { status: "loading", server: null }

let store: Store = LOADING
let inflight: Promise<void> | null = null
let lastLoadAt = 0
const listeners = new Set<() => void>()

const MODE_KEY = "rw:mode" // a UI preference, not security-relevant
const EPOCH_KEY = "rw:session-epoch" // bumped on sign-in/out so other tabs reload
const ACCOUNT_KEY = "last-iam-account" // convenience only, not sensitive

const emit = () => listeners.forEach((l) => l())
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function setStore(next: Store) {
  store = next
  if (next.server) mirrorSession(next.server) // dev-only bridge for the remaining mock modules
  emit()
}

const bumpEpoch = () => {
  try {
    window.localStorage.setItem(EPOCH_KEY, String(Date.now()))
  } catch {}
}

function readMode(): string | null {
  try {
    return window.localStorage.getItem(MODE_KEY)
  } catch {
    return null
  }
}

export function setPreferredMode(mode: ProfileKind) {
  try {
    window.localStorage.setItem(MODE_KEY, mode)
  } catch {}
  emit()
}

function toSession(view: SessionView, rawMode: string | null): Session {
  const base: Session =
    view.type === "root"
      ? {
          type: "root",
          email: view.email,
          name: view.name,
          alias: view.alias,
          pending: view.pending,
          profiles: view.profiles,
        }
      : {
          type: "iam",
          account: view.account,
          username: view.username,
          name: view.name,
          pending: view.pending,
          profiles: view.profiles,
          permissions: view.permissions,
          notificationEmail: view.notificationEmail,
        }

  const modes = availableModes(base)
  const preferred = isProfileKind(rawMode) && modes.includes(rawMode) ? rawMode : undefined
  return { ...base, mode: preferred ?? modes.find((m) => homeHref(base, m) !== null) ?? modes[0] }
}

/** (Re)loads the session from the API. Network failures never sign anyone out. */
export function loadSession(force = false): Promise<void> {
  if (inflight) return inflight
  if (!force && store.status === "ready") return Promise.resolve()

  inflight = api<{ session: SessionView }>("/auth/session")
    .then(
      (r) => ({ ok: true as const, server: r.session }),
      (e: unknown) =>
        e instanceof ApiError && e.status === 401 ? { ok: true as const, server: null } : { ok: false as const },
    )
    .then((res) => {
      lastLoadAt = Date.now()
      if (!res.ok) {
        if (store.status === "loading") setStore({ status: "ready", server: null })
        return
      }
      if (store.status === "ready" && JSON.stringify(store.server) === JSON.stringify(res.server)) return
      setStore({ status: "ready", server: res.server })
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

export const refreshSession = () => loadSession(true)

/** After any endpoint that returns a fresh session (sign-in, complete-profile, change-password, add-profile) */
export function applyServerSession(view: SessionView) {
  lastLoadAt = Date.now()
  setStore({ status: "ready", server: view })
  bumpEpoch()
}

export async function signOut() {
  try {
    await api("/auth/sign-out", { method: "POST" })
  } catch {} // already signed out, or offline: either way, drop local state
  setStore({ status: "ready", server: null })
  bumpEpoch()
}

export function getSession(): Session | null {
  return store.server ? toSession(store.server, readMode()) : null
}

/** Persist the active profile. Ignored if the user can't enter it. */
export function switchMode(mode: ProfileKind) {
  const s = getSession()
  if (s && availableModes(s).includes(mode)) setPreferredMode(mode)
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

/** undefined = loading, null = signed out, object = signed in */
export function useSession(): Session | null | undefined {
  const snap = useSyncExternalStore(subscribe, () => store, () => LOADING)
  const rawMode = useSyncExternalStore(subscribe, readMode, () => null)

  useEffect(() => {
    if (snap.status === "loading") void loadSession()
  }, [snap.status])

  return useMemo(
    () => (snap.status === "loading" ? undefined : snap.server ? toSession(snap.server, rawMode) : null),
    [snap, rawMode],
  )
}

/* ------------------------------------------------------------- browser hooks */

if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem("session") // leftover from the mock-session days
  } catch {}

  setUnauthenticatedHandler(() => setStore({ status: "ready", server: null }))

  window.addEventListener("storage", (e) => {
    if (e.key === EPOCH_KEY) void loadSession(true) // another tab signed in or out
    if (e.key === MODE_KEY) emit()
  })

  // Catches server-side changes (permissions edited, member disabled) when the user returns to the tab
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && store.status === "ready" && Date.now() - lastLoadAt > 30_000) {
      void loadSession(true)
    }
  })
}