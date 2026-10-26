import { CATEGORY_INFO, resolvePrefs, type AppNotification, type Category, type MockEmail, type Prefs } from "./notifications"
import { notificationsStore } from "./notifications-store"
import { notify } from "./notify"

export async function listNotifications(account: string, user: string): Promise<AppNotification[]> {
  return notificationsStore.list(account, user)
}

export async function markNotificationRead(account: string, user: string, id: string) {
  notificationsStore.markRead(account, user, [id])
}

export async function markAllRead(account: string, user: string) {
  notificationsStore.markRead(account, user)
}

export async function getPrefs(account: string, user: string): Promise<Prefs> {
  return resolvePrefs(notificationsStore.getPrefs(account, user))
}

/** Locks are enforced here, whatever the client sent */
export async function savePrefs(account: string, user: string, prefs: Prefs): Promise<Prefs> {
  const clean = resolvePrefs(prefs)
  notificationsStore.setPrefs(account, user, clean)
  return clean
}

export async function listOutbox(account: string): Promise<MockEmail[]> {
  return notificationsStore.outbox(account)
}

/** DEV ONLY */
export async function sendTestNotification(account: string, user: string, category: Category) {
  notify({
    account,
    category,
    to: [user],
    title: `Notifikasi uji: ${CATEGORY_INFO[category].label}`,
    body: "Ini adalah notifikasi percobaan dari pengaturan.",
    url: "/settings/notifications",
    tag: `test-${category}`,
  })
}