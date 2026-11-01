"use client"

import { useEffect, useState } from "react"
import { useSession } from "./auth"
import type { KycStatus } from "./kyc"
import { getKycStatus, KYC_EVENT } from "./kyc-api"

/** null = unknown, still loading, or signed out */
export function useKycStatus(): KycStatus | null {
  const session = useSession()
  const key = session ? (session.type === "root" ? session.email : `${session.username}@${session.account}`) : undefined
  const [state, setState] = useState<{ key: string; status: KycStatus | null } | null>(null)

  useEffect(() => {
    if (!key) return
    let cancelled = false
    const load = () =>
      getKycStatus().then((status) => {
        if (!cancelled) setState({ key, status })
      })
    const onVisible = () => {
      if (document.visibilityState === "visible") void load()
    }
    void load()
    window.addEventListener(KYC_EVENT, load)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      cancelled = true
      window.removeEventListener(KYC_EVENT, load)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [key])

  return state && state.key === key ? state.status : null
}