"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { PasswordInput } from "@/components/auth/password-input"
import { stepUp } from "@/lib/kyc-api"
import { markElevated } from "@/lib/step-up"

export function StepUpPrompt({
  onConfirmed,
  onCancel,
}: {
  onConfirmed: () => void
  onCancel: () => void
}) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const ok = await stepUp(password)
    setBusy(false)
    if (!ok) return setError("Password salah.")
    markElevated()
    setPassword("")
    onConfirmed()
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
      <p className="text-sm text-slate-800">
        Masukkan password Anda untuk melihat data ini. Akses dicatat di log aktivitas.
      </p>
      <PasswordInput
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        aria-label="Password"
        autoFocus
      />
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>Konfirmasi</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Batal</Button>
      </div>
    </form>
  )
}