"use client"

import { useEffect, useState } from "react"
import { BellOff, BellRing } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { isIOS, isStandalone, pushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client"
import { pushKeyOf } from "@/lib/push-key"
import { useActor } from "@/lib/use-actor"

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

const TEXT: Record<Status, string> = {
  loading: "Memeriksa…",
  unsupported: "Browser ini belum mendukung notifikasi push.",
  "needs-install":
    "Di iPhone/iPad, tambahkan aplikasi ke Layar Utama dulu (tombol Bagikan → Tambah ke Layar Utama), lalu buka dari sana untuk mengaktifkan notifikasi.",
  blocked: "Notifikasi diblokir di browser. Izinkan lewat pengaturan situs, lalu muat ulang halaman.",
  off: "Aktifkan agar notifikasi tiba meski aplikasi sedang tertutup.",
  on: "Aktif. Perangkat ini menerima notifikasi push.",
}

export function PushDeviceCard() {
  const actor = useActor()
  const [status, setStatus] = useState<Status>("loading")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    detect().then((s) => {
      if (!cancelled) setStatus(s)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function toggle() {
    if (!actor) return
    setBusy(true)
    if (status === "on") {
      await unsubscribeFromPush()
      setStatus("off")
    } else {
      const result = await subscribeToPush(pushKeyOf(actor))
      setStatus(result === "ok" ? "on" : result === "denied" ? "blocked" : "off")
    }
    setBusy(false)
  }

  const Icon = status === "on" ? BellRing : BellOff

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white p-4 md:p-6">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className={status === "on" ? "mt-0.5 size-5 text-brand" : "mt-0.5 size-5 text-slate-500"} aria-hidden />
        <div className="min-w-0">
          <h2 className="font-medium text-slate-900">Notifikasi push di perangkat ini</h2>
          <p className="text-sm text-slate-600">{TEXT[status]}</p>
        </div>
      </div>

      {(status === "off" || status === "on") && (
        <Button variant={status === "on" ? "outline" : "default"} size="sm" onClick={toggle} disabled={busy}>
          {status === "on" ? "Matikan" : "Aktifkan"}
        </Button>
      )}
    </section>
  )
}