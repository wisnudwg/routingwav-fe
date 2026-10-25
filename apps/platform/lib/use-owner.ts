"use client"

import { useMemo } from "react"
import { useSession } from "./auth"
import type { Owner } from "./team-api"

/** undefined = hydrating, null = not an owner session with an alias, else the owner */
export function useOwner(): Owner | null | undefined {
  const session = useSession()
  return useMemo(() => {
    if (session === undefined) return undefined
    if (session?.type === "root" && session.alias) {
      return { alias: session.alias, profiles: session.profiles }
    }
    return null
  }, [session])
}