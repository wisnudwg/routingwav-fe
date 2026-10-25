"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { homeFor, useSession } from "@/lib/auth"

/** Must be signed in, with no unfinished step, and be able to enter at least one mode */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = useSession()

  const blocked = !session || !!session.pending || !session.mode

  useEffect(() => {
    if (session === null) router.replace("/auth/sign-in")
    else if (session && (session.pending || !session.mode)) router.replace(homeFor(session))
  }, [session, router])

  if (blocked) return null
  return <>{children}</>
}