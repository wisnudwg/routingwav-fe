import type { AppNotification, MockEmail } from "./notifications"
import { readJson, writeJson } from "./mock-db"

export const NOTIFICATIONS_EVENT = "notifications-change"

const NKEY = "mock:notifications:v1"
const PKEY = "mock:notif-prefs:v1"
const EKEY = "mock:outbox:v1"
const OKEY = "mock:owner-emails:v1"

const emit = () => window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
const newest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt)

export const notificationsStore = {
  list: (account: string, user: string) =>
    readJson<AppNotification[]>(NKEY, [])
      .filter((n) => n.account === account && n.user === user)
      .sort(newest)
      .slice(0, 50),

  insert(n: AppNotification) {
    const all = readJson<AppNotification[]>(NKEY, [])
    all.push(n)
    writeJson(NKEY, all.slice(-300))
    emit()
  },

  /** No ids = every unread notification of this user */
  markRead(account: string, user: string, ids?: string[]) {
    const now = new Date().toISOString()
    const all = readJson<AppNotification[]>(NKEY, []).map((n) =>
      n.account === account && n.user === user && !n.readAt && (!ids || ids.includes(n.id))
        ? { ...n, readAt: now }
        : n
    )
    writeJson(NKEY, all)
    emit()
  },

  getPrefs: (account: string, user: string): unknown =>
    readJson<Record<string, unknown>>(PKEY, {})[`${account}:${user}`],

  setPrefs(account: string, user: string, prefs: unknown) {
    const all = readJson<Record<string, unknown>>(PKEY, {})
    all[`${account}:${user}`] = prefs
    writeJson(PKEY, all)
    emit()
  },

  queueEmail(m: MockEmail) {
    writeJson(EKEY, [...readJson<MockEmail[]>(EKEY, []), m].slice(-100))
    emit()
  },
  outbox: (account: string) =>
    readJson<MockEmail[]>(EKEY, []).filter((m) => m.account === account).sort(newest).slice(0, 30),

  ownerEmail: (account: string) => readJson<Record<string, string>>(OKEY, {})[account],
  setOwnerEmail(account: string, email: string) {
    const all = readJson<Record<string, string>>(OKEY, {})
    all[account] = email
    writeJson(OKEY, all)
  },

  markReadByUrl(account: string, user: string, url: string) {
    const now = new Date().toISOString()
    let changed = false
    const next = readJson<AppNotification[]>(NKEY, []).map((n) => {
      if (n.account === account && n.user === user && !n.readAt && n.url === url) {
        changed = true
        return { ...n, readAt: now }
      }
      return n
    })
    if (changed) {
      writeJson(NKEY, next)
      emit()
    }
  },
}