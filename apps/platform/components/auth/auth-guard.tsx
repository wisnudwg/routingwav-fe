"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useSession } from "@/lib/auth"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = useSession()

  useEffect(() => {
    if (session === null) router.replace("/auth/sign-in")
  }, [session, router])

  if (!session) return null // hydrating or redirecting
  return <>{children}</>
}