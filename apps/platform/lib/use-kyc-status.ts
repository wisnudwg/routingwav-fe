"use client"

import { useEffect, useState } from "react"
import { useSession } from "./auth"
import type { KycStatus } from "./kyc"
import { getKycStatus, KYC_EVENT } from "./kyc-api"

/** null = unknown, still loading, or signed out */
export function useKycStatus(): KycStatus | null {
  const session = useSession()
  const alias = session ? (session.type === "root" ? session.alias : session.account) : undefined
  const [state, setState] = useState<{ alias: string; status: KycStatus } | null>(null)

  useEffect(() => {
    if (!alias) return
    let cancelled = false
    const load = () =>
      getKycStatus(alias).then((status) => {
        if (!cancelled) setState({ alias, status })
      })
    load()
    window.addEventListener(KYC_EVENT, load)
    window.addEventListener("storage", load)
    return () => {
      cancelled = true
      window.removeEventListener(KYC_EVENT, load)
      window.removeEventListener("storage", load)
    }
  }, [alias])

  return state && state.alias === alias ? state.status : null
}