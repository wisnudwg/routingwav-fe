"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { homeFor, useSession } from "@/lib/auth"
import type { ProfileKind } from "@/lib/roles"

export function AuthGuard({
  children,
  mode,
}: {
  children: React.ReactNode
  mode?: ProfileKind
}) {
  const router = useRouter()
  const session = useSession()

  const wrongMode = !!session && !!mode && session.mode !== mode
  const blocked = !session || !!session.pending || wrongMode

  useEffect(() => {
    if (session === null) router.replace("/auth/sign-in")
    else if (session && (session.pending || wrongMode)) router.replace(homeFor(session))
  }, [session, wrongMode, router])

  if (blocked) return null
  return <>{children}</>
}