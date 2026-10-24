"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { homeFor, useSession, type PendingStep } from "@/lib/auth"

type Props = { children: React.ReactNode } & (
  | { mode: "guest" } // signed-out visitors only (sign-in, register)
  | { mode: "pending"; step: PendingStep } // only people stuck on this step
)

export function SessionGate(props: Props) {
  const router = useRouter()
  const session = useSession()

  const target: string | null = (() => {
    if (session === undefined) return null
    if (props.mode === "guest") return session ? homeFor(session) : null
    if (!session) return "/auth/sign-in"
    return session.pending === props.step ? null : homeFor(session)
  })()

  useEffect(() => {
    if (target) router.replace(target)
  }, [target, router])

  if (session === undefined || target) return null // hydrating or redirecting
  return <>{props.children}</>
}