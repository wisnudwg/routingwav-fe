// use-notifications.ts
"use client"

import { useEffect, useState } from "react"
import { requesterKey } from "./approvals"
import type { AppNotification } from "./notifications"
import { listNotifications } from "./notifications-api"
import { NOTIFICATIONS_EVENT } from "./notifications-store"
import { useActor } from "./use-actor"

export function useNotifications() {
  const actor = useActor()
  const alias = actor?.alias
  const user = actor ? requesterKey(actor) : undefined
  const [state, setState] = useState<{ key: string; items: AppNotification[] } | null>(null)

  useEffect(() => {
    if (!alias || !user) return
    const key = `${alias}:${user}`
    let cancelled = false
    const load = () =>
      listNotifications(alias, user).then((items) => {
        if (!cancelled) setState({ key, items })
      })
    void load()
    window.addEventListener(NOTIFICATIONS_EVENT, load)
    window.addEventListener("storage", load) // other tabs of this browser
    return () => {
      cancelled = true
      window.removeEventListener(NOTIFICATIONS_EVENT, load)
      window.removeEventListener("storage", load)
    }
  }, [alias, user])

  const items = state && alias && user && state.key === `${alias}:${user}` ? state.items : null
  return { alias, user, items, unread: items ? items.filter((n) => !n.readAt).length : 0 }
}