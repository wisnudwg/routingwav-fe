"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { homeFor, useSession } from "@/lib/auth"

export function HomeRedirect() {
  const router = useRouter()
  const session = useSession()

  useEffect(() => {
    if (session === undefined) return
    router.replace(session ? homeFor(session) : "/auth/sign-in")
  }, [session, router])

  return null
}