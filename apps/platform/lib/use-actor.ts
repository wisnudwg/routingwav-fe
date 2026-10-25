// use-actor.ts
"use client"

import { useMemo } from "react"
import { actorOf } from "./actor"
import { useSession } from "./auth"
import type { Actor } from "./approvals"

/** undefined = hydrating, null = signed out (or an owner session without an alias) */
export function useActor(): Actor | null | undefined {
  const session = useSession()
  return useMemo(
    () => (session === undefined ? undefined : session ? actorOf(session) : null),
    [session]
  )
}