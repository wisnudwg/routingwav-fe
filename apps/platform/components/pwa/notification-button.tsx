"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, BellRing } from "lucide-react"
import { getSession, sessionId } from "@/lib/auth"
import {
  isIOS,
  isStandalone,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client"

type Status = "loading" | "unsupported" | "needs-install" | "blocked" | "off" | "on"

async function detect(): Promise<Status> {
  // Order matters: iOS Safari in a normal tab has no PushManager at all
  if (isIOS() && !isStandalone()) return "needs-install"
  if (!pushSupported()) return "unsupported"
  if (Notification.permission === "denied") return "blocked"
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return Notification.permission === "granted" && sub ? "on" : "off"
}

const HINTS: Partial<Record<Status, string>> = {
  "needs-install":
    "Di iPhone/iPad, tambahkan aplikasi ke Layar Utama dulu (tombol Bagikan → Tambah ke Layar Utama), lalu buka dari sana untuk mengaktifkan notifikasi.",
  blocked: "Notifikasi diblokir. Izinkan lewat pengaturan situs di browser Anda.",
  unsupported: "Browser ini belum mendukung notifikasi push.",
}

export function NotificationButton() {
  const [status, setStatus] = useState<Status>("loading")
  const [busy, setBusy] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    let cancelled = false
    detect().then((s) => !cancelled && setStatus(s))
    return () => {
      cancelled = true
    }
  }, [])

  async function onClick() {
    const session = getSession()
    const result = await subscribeToPush(session ? sessionId(session) : "")
  }

  const Icon = status === "on" ? BellRing : status === "off" || status === "loading" ? Bell : BellOff
  const label = status === "on" ? "Matikan notifikasi" : "Aktifkan notifikasi"

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={busy || status === "loading"}
        aria-label={label}
        title={label}
        className="grid size-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-50"
      >
        <Icon className={status === "on" ? "size-5 text-brand" : "size-5"} />
      </button>

      {showHint && HINTS[status] && (
        <div
          role="status"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border bg-white p-3 text-xs leading-relaxed text-slate-700 shadow-lg"
        >
          {HINTS[status]}
        </div>
      )}
    </div>
  )
}