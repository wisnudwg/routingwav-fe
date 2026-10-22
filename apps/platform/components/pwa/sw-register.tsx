"use client"

import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/push-client"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      registerServiceWorker().catch((err) => console.error("SW registration failed", err))
    }
  }, [])
  return null
}