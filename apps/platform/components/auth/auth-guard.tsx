"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { homeFor, useSession } from "@/lib/auth"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = useSession()

  useEffect(() => {
    if (session === null) router.replace("/auth/sign-in")
    else if (session?.pending) router.replace(homeFor(session))
  }, [session, router])

  if (!session || session.pending) return null
  return <>{children}</>
}