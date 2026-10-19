import { useSyncExternalStore } from "react"

const KEY = "email"
const EVENT = "auth-change"

export function getStoredEmail(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function storeEmail(email: string) {
  try {
    window.localStorage.setItem(KEY, email)
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

export function clearStoredEmail() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb) // other tabs
  window.addEventListener(EVENT, cb) // this tab
  return () => {
    window.removeEventListener("storage", cb)
    window.removeEventListener(EVENT, cb)
  }
}

/** undefined = server / hydrating, null = signed out, string = signed in */
export function useStoredEmail(): string | null | undefined {
  return useSyncExternalStore(subscribe, getStoredEmail, () => undefined)
}