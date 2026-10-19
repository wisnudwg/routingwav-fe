"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useStoredEmail } from "@/lib/auth"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const email = useStoredEmail()

  useEffect(() => {
    if (email === null) router.replace("/auth/sign-in")
  }, [email, router])

  if (!email) return null // hydrating or redirecting: render nothing, no flash
  return <>{children}</>
}