"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { homeFor, switchMode, useSession } from "@/lib/auth"
import { availableModes } from "@/lib/permissions"
import type { ProfileKind } from "@/lib/roles"

/** The URL decides the mode: switch silently if allowed, otherwise send the user home */
export function ModeGate({ mode, children }: { mode: ProfileKind; children: React.ReactNode }) {
  const router = useRouter()
  const session = useSession()

  const allowed = !!session && availableModes(session).includes(mode)
  const needsSwitch = allowed && session?.mode !== mode

  useEffect(() => {
    if (!session) return
    if (!allowed) router.replace(homeFor(session))
    else if (needsSwitch) switchMode(mode)
  }, [session, allowed, needsSwitch, mode, router])

  if (!allowed || needsSwitch) return null
  return <>{children}</>
}