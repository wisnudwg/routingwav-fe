"use client"

import { useEffect, useState } from "react"
import { requesterKey } from "./approvals"
import { getUnreadTotal } from "./messages-api"
import { MESSAGES_EVENT } from "./messages-store"
import { useActor } from "./use-actor"

export function useMessageUnread(): number {
  const actor = useActor()
  const key = actor ? `${actor.alias}:${requesterKey(actor)}` : ""
  const [state, setState] = useState<{ key: string; count: number } | null>(null)

  useEffect(() => {
    if (!actor) return
    let cancelled = false
    const load = () =>
      getUnreadTotal(actor).then((count) => {
        if (!cancelled) setState({ key, count })
      })
    void load()
    window.addEventListener(MESSAGES_EVENT, load)
    window.addEventListener("storage", load) // other tabs of this browser
    return () => {
      cancelled = true
      window.removeEventListener(MESSAGES_EVENT, load)
      window.removeEventListener("storage", load)
    }
  }, [actor, key])

  return state && state.key === key ? state.count : 0
}