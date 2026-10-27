import type { Category } from "./notifications"
import { resolvePrefs } from "./notifications"
import { notificationsStore } from "./notifications-store"
import { teamStore } from "./team-store"

export type NotifyInput = {
  account: string
  category: Category
  /** "owner" and/or member usernames */
  to: string[]
  title: string
  body: string
  /** In-app path, e.g. "/approvals" */
  url: string
  /** Same tag = replaces the previous OS notification */
  tag?: string
  /** Whoever caused the event: they get no push (they're looking at the screen) */
  by?: string
}

async function sendPush(key: string, payload: { title: string; body: string; url: string; tag: string }) {
  if (process.env.NODE_ENV === "production") return // dev stub: the real server sends pushes itself
  try {
    await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, ...payload }),
    })
  } catch {}
}

/** Owner: the account email. Member: only a VERIFIED address, otherwise nothing. */
function emailFor(account: string, user: string): string | undefined {
  if (user === "owner") return notificationsStore.ownerEmail(account)
  const m = teamStore.find(account, user)
  return m?.emailVerified && m.email ? m.email : undefined
}

export function notify(input: NotifyInput) {
  const { account, category, title, body, url, tag, by } = input
  const createdAt = new Date().toISOString()

  for (const user of new Set(input.to)) {
    if (user !== "owner") {
      const member = teamStore.find(account, user)
      if (!member || member.status !== "active") continue
    }

    // 1) In-app: always
    notificationsStore.insert({ id: crypto.randomUUID(), account, user, category, title, body, url, createdAt })

    const prefs = resolvePrefs(notificationsStore.getPrefs(account, user))[category]

    // 2) Push
    if (prefs.push && user !== by) {
      void sendPush(`${account}:${user}`, { title, body, url, tag: tag ?? category })
    }

    // 3) Email
    if (prefs.email) {
      const to = emailFor(account, user)
      if (to) {
        notificationsStore.queueEmail({
          id: crypto.randomUUID(),
          account,
          to,
          category,
          subject: title,
          body: `${body}\n\nBuka: ${window.location.origin}${url}`,
          createdAt,
        })
      }
    }
  }
}