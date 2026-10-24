"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { resendVerification } from "@/lib/auth-api"

export function ResendVerification({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")

  async function resend() {
    setState("sending")
    await resendVerification(email)
    setState("sent")
  }

  return (
    <div className="space-y-1.5">
      <Button type="button" variant="outline" size="sm" onClick={resend} disabled={state === "sending"}>
        {state === "sending" ? "Mengirim…" : "Kirim ulang email verifikasi"}
      </Button>
      {state === "sent" && (
        <p role="status" className="text-xs text-slate-600">
          Jika akun ini ada dan belum terverifikasi, email baru telah dikirim.
        </p>
      )}
    </div>
  )
}